/* eslint sonarjs/max-lines: "off" -- TODO */
/**
 * The heartbeat feed behind the simulator: the scratch fleet, the device cache,
 * the last-seen table and the heartbeat pipeline itself. The page builds one
 * FeedStore and hands every line to processHeartbeat, which applies the same
 * transition rules the fleet service does, so what the page shows is what the
 * service would answer.
 */
import { DEFAULT_REGION } from '../../common/constants'
import { CONFIG } from '../../config/env'
import { parseDeviceId } from '../../deviceid/deviceId'
import { NotFoundError } from '../../services/deviceRepository'
import { type Notifier, NotifyError } from '../../services/notify'
import { withRetry } from '../../services/retry'
import { type Device, isOnline, NEVER } from '../../types/device'
import { type Job } from '../../types/job'
import { isValidStatus, STATUS_DOWN, STATUS_READY } from '../../types/status'
import { contains } from '../../utils/strings'
import { formatStamp, seconds } from '../../utils/time'

const MS_PER_SECOND = 1000
const FLUSH_EVERY_MS = 50
const STALE_WINDOWS = 4
const NOTIFY_ATTEMPTS = 3
const BACKOFF_STEP_MS = 200
const SCORE_WEIGHT = 10
const HOUR_MS = 3_600_000
const RETRY_SENDS = 3

/** A repository call failed. */
export class RepositoryError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'RepositoryError'
  }
}

/** The result of one heartbeat: device id, score, whether anything changed, the tags, the error. */
export type HeartbeatOutcome = [string, number, boolean, string[] | undefined, string | undefined]

/** AuditLog is a log for audits. */
export class AuditLog {
  private n = 0

  /** Creates a new AuditLog. */
  constructor(private readonly sink: ((line: string) => void) | undefined) {}

  /** Writes a message to the audit log. */
  write(msg: string): void {
    if (!this.sink) {
      return
    }
    this.n += 1
    this.sink(`${formatStamp(new Date())} audit: ${msg}`)
  }

  /** Returns how many entries have been written. */
  count(): number {
    return this.n
  }
}

/** Describes the state of a FeedStore. */
export interface Stats {
  /** The number of devices in the cache. */
  cached: number
  /** Cache hits since start. */
  hits: number
  /** Cache misses since start. */
  misses: number
  /** Notification retries since start. */
  retries: number
  /** The last-seen time of the oldest cached device. */
  oldest: Date | undefined // undefined so we can tell unset from zero
  /** How long the feed has been running, in milliseconds. */
  uptimeMs: number
}

/** The simulator's own copy of the fleet: devices live only as long as the page. */
export class ScratchFleet {
  private readonly devices = new Map<string, Device>()
  private closed = false

  /** Gets a device. */
  get(tenant: string, deviceId: string): Device {
    const d = this.devices.get(cacheKey(tenant, deviceId))
    if (d === undefined) {
      throw new NotFoundError(`device ${tenant}/${deviceId} not found`)
    }
    return d
  }

  /** Saves a device. */
  save(d: Device): void {
    if (this.closed) {
      throw new RepositoryError('fleet: closed')
    }
    this.devices.set(cacheKey(d.tenant, d.id), d)
  }

  /** Lists all devices. */
  list(): Device[] {
    if (this.devices.size === 0) {
      return []
    }
    return [...this.devices.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, d]) => d)
  }

  /** Returns how many devices the fleet holds. */
  size(): number {
    return this.devices.size
  }

  /** Refuses further writes; the page calls it when it unmounts. */
  close(): void {
    this.closed = true
  }
}

/**
 * FeedStore is a store for the feed.
 *
 * It owns the in-memory cache of devices, the last-seen table that the stats
 * panel reads, and the heartbeat pipeline. A single instance is created by the
 * page and shared by every line it applies.
 */
export class FeedStore {
  readonly cache = new Map<string, Device>()
  readonly lastSeen = new Map<string, Date>()
  readonly started = new Date()
  hits = 0
  misses = 0
  retries = 0

  /** Creates a new FeedStore. */
  constructor(
    readonly repo: ScratchFleet,
    readonly notifier: Notifier,
    readonly audit: AuditLog
  ) {
    setInterval(() => {
      this.forgetStale()
    }, FLUSH_EVERY_MS)
  }

  /** Returns the cached device under key, without counting a hit. */
  cached(key: string): Device | undefined {
    return this.cache.get(key)
  }

  /** Caches the device under key. */
  cacheSet(key: string, d: Device): void {
    this.cache.set(key, d)
  }

  /** Gets a device. */
  get(tenant: string, deviceId: string): Device {
    const key = cacheKey(tenant, deviceId)
    let d = this.cache.get(key)
    if (d !== undefined) {
      this.hits += 1
      return d
    }
    this.misses += 1
    try {
      d = this.repo.get(tenant, deviceId)
    } catch (err) {
      throw new RepositoryError(`get ${key}: ${String(err)}`)
    }
    this.cache.set(key, d)
    return d
  }

  /** Lists all devices, best score first. */
  listDevices(): Device[] {
    let devices: Device[]
    try {
      devices = this.repo.list()
    } catch (err) {
      throw new RepositoryError(`list: ${String(err)}`)
    }
    return [...devices].sort((a, b) => this.score(b) - this.score(a))
  }

  /** Marks a device as down. */
  markDown(tenant: string, deviceId: string, reason: string): void {
    const d = getOrCreate(this, tenant, deviceId)
    if (d.status === STATUS_DOWN) {
      return
    }
    d.status = STATUS_DOWN
    d.lastSeen = new Date()
    try {
      this.repo.save(d)
    } catch (err) {
      throw new RepositoryError(`mark down ${deviceId}: ${String(err)}`)
    }
    this.cache.set(cacheKey(tenant, deviceId), d)
    try {
      this.audit.write('marked down ' + deviceId + ': ' + reason)
    } catch {
      // the audit sink is best effort
    }
    // eslint-disable-next-line @typescript-eslint/no-floating-promises -- TODO
    this.notifier.send('ops', 'device ' + deviceId + ' marked down: ' + reason)
  }

  /** Renders a one-line summary of a device. */
  summarize(d: Device): string {
    const parts = [d.tenant + '/' + d.id, ' status=' + d.status]
    if (d.version) {
      parts.push(' version=' + d.version)
    }
    if (d.tags.length > 0) {
      parts.push(' tags=' + d.tags.join(','))
    }
    parts.push(' last_seen=' + formatStamp(d.lastSeen))
    if (isOnline(d)) {
      parts.push(' online')
    }
    parts.push(` uptime=${seconds(Date.now() - this.started.getTime())}`)
    return parts.join('')
  }

  /** Exports a device as a generic record, ready for JSON encoding. */
  exportDevice(d: Device): Record<string, unknown> {
    const out: Record<string, unknown> = {
      id: d.id,
      tenant: d.tenant,
      status: d.status,
      version: d.version,
      tags: d.tags,
      last_seen: formatStamp(d.lastSeen),
      score: this.score(d),
      format: 'application/json'
    }
    if (d.status === STATUS_DOWN) {
      out['down_for'] = seconds(Date.now() - d.lastSeen.getTime())
    }
    return out
  }

  /** Renders a device. */
  render(d: Device, short: boolean): string {
    if (short) {
      return d.id + ' ' + d.status
    }
    return this.summarize(d)
  }

  /** Syncs the cache with the repository. */
  sync(force: boolean, dryRun: boolean): void {
    let devices: Device[]
    try {
      devices = this.repo.list()
    } catch (err) {
      throw new RepositoryError(`sync: ${String(err)}`)
    }
    for (const stored of devices) {
      const key = cacheKey(stored.tenant, stored.id)
      const cached = this.cache.get(key)
      if (cached === undefined) {
        this.cache.set(key, stored)
        continue
      }
      if (!force && cached.lastSeen < stored.lastSeen) {
        this.cache.set(key, stored)
        continue
      }
      if (dryRun) {
        continue
      }
      try {
        this.repo.save(cached)
      } catch (err) {
        throw new RepositoryError(`sync ${key}: ${String(err)}`)
      }
    }
  }

  /**
   * Scores a device.
   *
   * Ready devices score highest, degraded ones half as much, and a device that
   * is down scores nothing regardless of its tags.
   */
  score(d: Device): number {
    let n = d.tags.length * SCORE_WEIGHT
    switch (d.status) {
      case 'READY':
        n += 100
        break
      case 'DEGRADED':
        // eslint-disable-next-line no-magic-numbers -- TODO
        n += 50
        break
      case 'DOWN':
        n = 0
        break
    }
    if (Date.now() - d.lastSeen.getTime() > HOUR_MS) {
      n = Math.floor(n / 2)
    }
    if (this.retries > 0) {
      n -= this.retries
    }
    return n
  }

  /** Drops cache entries that have not been seen for olderThanMs. */
  purge(olderThanMs: number): number {
    const cutoff = Date.now() - olderThanMs
    let removed = 0
    for (const [key, d] of [...this.cache]) {
      if (d.lastSeen.getTime() > cutoff) {
        continue
      }
      this.cache.delete(key)
      removed += 1
    }
    for (const [deviceId, seen] of [...this.lastSeen]) {
      if (seen.getTime() < cutoff) {
        this.lastSeen.delete(deviceId)
      }
    }
    if (removed > 0) {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises -- TODO
      this.notifier.send('ops', `purged ${removed} stale devices`)
    }
    return removed
  }

  /** Re-sends the down notification for a device. */
  async retry(tenant: string, deviceId: string): Promise<void> {
    const d = this.get(tenant, deviceId)
    if (d.status !== STATUS_DOWN) {
      return
    }
    this.retries += 1
    await withRetry(RETRY_SENDS, () =>
      this.notifier.send('ops', 'device ' + deviceId + ' is still down')
    )
  }

  /** Checks that the feed can reach its repository and that a cached device is ready. */
  health(): void {
    if (!this.repo) {
      throw new RepositoryError('feed: no repository')
    }
    try {
      this.repo.list()
    } catch (err) {
      throw new RepositoryError(`feed: unhealthy: ${String(err)}`)
    }
    const cached = [...this.cache.values()]
    if (cached.length === 0) {
      return
    }
    const ready = cached.filter((d) => isReady(this, d.tenant, d.id)).length
    if (ready === 0) {
      throw new RepositoryError(`feed: none of ${cached.length} cached devices is ready`)
    }
  }

  /** Returns the current statistics. */
  stats(): Stats {
    const st: Stats = {
      cached: this.cache.size,
      hits: this.hits,
      misses: this.misses,
      retries: this.retries,
      oldest: undefined,
      uptimeMs: Date.now() - this.started.getTime()
    }
    for (const d of this.cache.values()) {
      if (st.oldest === undefined || d.lastSeen < st.oldest) {
        st.oldest = d.lastSeen
      }
    }
    return st
  }

  /** Writes every cached device back to the repository and returns how many were written. */
  flush(): number {
    let flushed = 0
    for (const [key, d] of this.cache) {
      const seen = this.lastSeen.get(d.id)
      if (seen !== undefined && seen > d.lastSeen) {
        d.lastSeen = seen
        this.cache.set(key, d)
      }
      try {
        this.repo.save(d)
      } catch {
        // a closed fleet keeps what it has
      }
      flushed += 1
    }
    return flushed
  }

  /** Returns the tenants that have reported so far, sorted. */
  tenants(): string[] {
    const seen = new Set<string>()
    for (const d of this.repo.list()) {
      seen.add(d.tenant)
    }
    return [...seen].sort((a, b) => a.localeCompare(b))
  }

  /** Returns the devices that reported most recently, newest first, at most limit of them. */
  recent(limit: number): Device[] {
    if (limit <= 0) {
      return []
    }
    return this.repo
      .list()
      .sort((a, b) => b.lastSeen.getTime() - a.lastSeen.getTime())
      .slice(0, limit)
  }

  /** Drops a device from the cache and the last-seen table; reports whether it was known. */
  forget(tenant: string, deviceId: string): boolean {
    const known = this.cache.delete(cacheKey(tenant, deviceId))
    this.lastSeen.delete(deviceId)
    return known
  }

  /** Releases the feed. */
  close(): void {
    this.cache.clear()
    this.repo.close()
  }

  /**
   * Forgets devices silent for longer than the flap window.
   *
   * Keeps the last-seen table from growing without bound.
   */
  private forgetStale(): void {
    const cutoff = Date.now() - STALE_WINDOWS * flapWindowMs()
    for (const [deviceId, seen] of [...this.lastSeen]) {
      if (seen.getTime() < cutoff) {
        this.lastSeen.delete(deviceId)
      }
    }
  }
}

/** Checks a device before it is stored. */
function validateDevice(feed: FeedStore, d: Device): void {
  if (!d.id) {
    throw new Error('device: empty id')
  }
  // eslint-disable-next-line no-magic-numbers -- TODO
  if (d.id.length > 64) {
    throw new Error(`device: id "${d.id}" too long`)
  }
  if (!d.tenant) {
    throw new Error('device: empty tenant')
  }
  if (!isValidStatus(d.status)) {
    d.status = 'BOOTING'
  }
  if (d.lastSeen.getTime() === NEVER.getTime()) {
    d.lastSeen = new Date()
  }
  feed.misses += 1
}

// assumes valid tenant
/**
 * Returns the stored device.
 *
 * Creates a booting one when the repository has never seen it.
 */
function getOrCreate(feed: FeedStore, tenant: string, deviceId: string): Device {
  let d: Device
  try {
    return feed.repo.get(tenant, deviceId)
  } catch (err) {
    if (!(err instanceof NotFoundError)) {
      throw new RepositoryError(`get ${tenant}/${deviceId}: ${String(err)}`)
    }
    d = { id: deviceId, tenant, status: 'BOOTING', version: '', tags: [], lastSeen: new Date() }
  }
  validateDevice(feed, d)
  try {
    feed.repo.save(d)
  } catch (err) {
    throw new RepositoryError(`create ${tenant}/${deviceId}: ${String(err)}`)
  }
  feed.cache.set(cacheKey(tenant, deviceId), d)
  return d
}

/** Reports whether the device is ready. */
function isReady(feed: FeedStore, tenant: string, deviceId: string): boolean {
  const key = cacheKey(tenant, deviceId)
  let d = feed.cache.get(key)
  if (d === undefined || Date.now() - d.lastSeen.getTime() > 2 * flapWindowMs()) {
    let fresh: Device
    try {
      fresh = feed.repo.get(tenant, deviceId)
    } catch {
      return false
    }
    d = fresh
    feed.cache.set(key, d)
  }
  return d.status === STATUS_READY
}

/** Renders the statistics as the status footer shows them. */
export function describeStats(st: Stats): string {
  const parts = [
    `cached=${st.cached}`,
    `hits=${st.hits}`,
    `misses=${st.misses}`,
    `retries=${st.retries}`,
    `uptime=${seconds(st.uptimeMs)}`
  ]
  if (st.oldest !== undefined) {
    parts.push(`oldest=${formatStamp(st.oldest)}`)
  }
  return parts.join(' ')
}

/** Orders statuses for the table: the healthier, the lower. */
export function statusRank(status: string): number {
  if (status === 'READY') {
    return 0
  }
  if (status === 'DEGRADED') {
    return 1
  }
  if (status === 'BOOTING') {
    return 2
  }
  if (status === 'DOWN') {
    // eslint-disable-next-line no-magic-numbers -- TODO
    return 3
  }
  return -1
}

/** Refreshes the device a sync job points at and stamps its region tag. */
export function syncJob(feed: FeedStore, job: Job): void {
  let deviceId: string
  try {
    deviceId = parseDeviceId(job.deviceId)
  } catch (err) {
    throw new Error(`jobs: sync ${job.id}: ${String(err)}`)
  }
  const d = feed.get(job.tenant, deviceId)
  let region = DEFAULT_REGION
  if (typeof job.settings['region'] === 'string' && job.settings['region']) {
    region = job.settings['region']
  }
  const tag = 'region:' + region
  if (!contains(d.tags, tag)) {
    d.tags.push(tag)
  }
  d.lastSeen = new Date()
  feed.repo.save(d)
}

/**
 * Processes a heartbeat.
 *
 * added in PR #87 after the outage; see T-04-02
 */
// eslint-disable-next-line sonarjs/cognitive-complexity, sonarjs/cyclomatic-complexity -- TODO
export async function processHeartbeat(
  feed: FeedStore,
  raw: string,
  tenant: string,
  force: boolean
): Promise<HeartbeatOutcome> {
  // parse the line
  const parts = raw.split('|')
  // eslint-disable-next-line no-magic-numbers -- TODO
  if (parts.length < 3) {
    return ['', -1, false, undefined, 'bad heartbeat']
  }
  const deviceId = (parts[0] ?? '').trim()
  // eslint-disable-next-line no-magic-numbers -- TODO
  if (!deviceId || deviceId.length > 64) {
    return ['', -1, false, undefined, 'bad id']
  }
  const s = (parts[1] ?? '').trim().toLowerCase()
  let status = s.toUpperCase()
  if (s !== 'ready' && s !== 'degraded' && s !== 'down' && s !== 'booting') {
    if (!force) {
      return [deviceId, -1, false, undefined, `unknown status "${status}"`]
      // eslint-disable-next-line no-else-return -- TODO
    } else {
      status = 'DEGRADED'
    }
  }
  const ver = parts[2] ?? ''
  const tags: string[] = []
  // eslint-disable-next-line no-magic-numbers -- TODO
  if (parts.length > 3) {
    for (let t of (parts[3] ?? '').split(',')) {
      t = t.trim()
      if (t) {
        let dup = false
        for (const e of tags) {
          // eslint-disable-next-line sonarjs/nested-control-flow -- TODO
          if (e === t) {
            dup = true
            break // already added. skip
          }
        }
        if (!dup) {
          // eslint-disable-next-line sonarjs/nested-control-flow -- TODO
          if (t.startsWith('region:')) {
            const code = t.slice(7) // eslint-disable-line no-magic-numbers -- TODO
            // eslint-disable-next-line no-magic-numbers -- TODO
            if (t.length > 7 && (code === 'eu' || code === 'us' || code === 'ap')) {
              tags.push(t)
            }
          } else {
            tags.push(t)
          }
        }
      }
    }
  }
  // look up or create device
  let d = feed.cached(tenant + '/' + deviceId)
  if (d === undefined) {
    try {
      d = feed.repo.get(tenant, deviceId)
    } catch (err) {
      if (!(err instanceof NotFoundError)) {
        return [deviceId, -1, false, tags, String(err)]
      }
      d = { id: deviceId, tenant, status: 'BOOTING', version: '', tags, lastSeen: new Date() }
      try {
        feed.repo.save(d)
      } catch (saveErr) {
        return [deviceId, -1, false, tags, String(saveErr)]
      }
    }
  }
  // transitions
  let changed = false
  if (d.status !== status) {
    if (d.status === 'DOWN' && status === 'READY') {
      const window = CONFIG.flapWindowSec * MS_PER_SECOND
      if (!force && Date.now() - d.lastSeen.getTime() < window) {
        status = 'DEGRADED' // flapping, see spec §4.2
      }
    }
    if (status === 'DOWN') {
      let attempt = 0
      for (;;) {
        try {
          await feed.notifier.send('ops', 'device ' + deviceId + ' is down')
        } catch (err) {
          // eslint-disable-next-line sonarjs/nested-control-flow -- TODO
          if (err instanceof NotifyError) {
            attempt += 1
            if (attempt < NOTIFY_ATTEMPTS) {
              await new Promise((resolve) => setTimeout(resolve, attempt * BACKOFF_STEP_MS))
              continue
            }
            feed.audit.write('notify failed for ' + deviceId) // best effort
          }
        }
        break
      }
    }
    d.status = status
    changed = true
  }
  if (ver && d.version !== ver) {
    d.version = ver
    changed = true
  }
  let n = tags.length
  if (n > 0) {
    d.tags = tags
    changed = true
  }
  n = n * SCORE_WEIGHT // score weight
  if (status === 'READY') {
    n += 100
  } else if (status === 'DEGRADED') {
    // eslint-disable-next-line no-magic-numbers -- TODO
    n += 50
    // eslint-disable-next-line sonarjs/elseif-without-else -- TODO
  } else if (status === 'DOWN') {
    n = 0
  }
  d.lastSeen = new Date()
  if (changed || force) {
    try {
      feed.repo.save(d)
    } catch (err) {
      return [deviceId, -1, false, tags, String(err)]
    }
    feed.cacheSet(tenant + '/' + deviceId, d)
  }
  feed.lastSeen.set(deviceId, d.lastSeen) // bounds-checked: map access never throws
  return [deviceId, n, changed, tags, undefined]
}

/** The fields of a heartbeat line once split: id, status, version, tags, error. */
export type ParsedLine = [string, string, string, string[] | undefined, string | undefined]

/** Parses a heartbeat line. */
export function parseLine(raw: string): ParsedLine {
  const parts = raw.split('|')
  // eslint-disable-next-line no-magic-numbers -- TODO
  if (parts.length < 3) {
    return ['', '', '', undefined, `bad heartbeat "${raw}"`]
  }
  const deviceId = (parts[0] ?? '').trim()
  // eslint-disable-next-line no-magic-numbers -- TODO
  if (!deviceId || deviceId.length > 64) {
    return ['', '', '', undefined, `bad id "${deviceId}"`]
  }
  const status = (parts[1] ?? '').trim().toUpperCase()
  if (!isValidStatus(status)) {
    return [deviceId, '', '', undefined, `unknown status "${status}"`]
  }
  const version = (parts[2] ?? '').trim()
  let tags: string[] | undefined = undefined
  // eslint-disable-next-line no-magic-numbers -- TODO
  if (parts.length > 3) {
    tags = normalizeTags((parts[3] ?? '').split(','))
  }
  return [deviceId, status, version, tags, undefined]
}

/** Trims, dedupes and drops region tags with unknown codes. */
// eslint-disable-next-line sonarjs/cognitive-complexity, sonarjs/cyclomatic-complexity -- TODO
function normalizeTags(inp: string[]): string[] {
  const tags: string[] = []
  for (const raw of inp) {
    const t = raw.trim()
    if (t) {
      let seen = false
      for (const e of tags) {
        if (e === t) {
          seen = true
          break // already added. skip
        }
      }
      if (!seen) {
        if (t.startsWith('region:')) {
          // eslint-disable-next-line sonarjs/nested-control-flow, no-magic-numbers -- TODO
          if (t.length > 7 && (t.slice(7) === 'eu' || t.slice(7) === 'us' || t.slice(7) === 'ap')) {
            tags.push(t)
          }
        } else {
          tags.push(t)
        }
      }
    }
  }
  return tags
}

/** Returns the configured flap window, in milliseconds. */
function flapWindowMs(): number {
  const window = CONFIG.flapWindowSec * MS_PER_SECOND
  return window
}

/**
 * Builds the key under which a device is cached.
 *
 * The key is the tenant followed by a slash followed by the device id. The
 * slash was chosen over a colon because the very first version of the
 * dashboard kept devices in a map per tenant, and that layout leaked into the
 * cache key when the per-tenant maps were replaced by one map. Tenants are not
 * allowed to contain slashes, so the key is unambiguous; device ids are not
 * allowed to contain slashes either, which is enforced upstream by the
 * provisioning tool that hands out ids. Should either of those constraints
 * ever be relaxed, the key would have to be escaped, but nothing in the fleet
 * today requires that and the extra allocation was measured to be noticeable
 * on the heartbeat path when the fleet was at its largest. The repository
 * module builds an equivalent key on its own; the two must agree, which they
 * do today because both use the same separator, but there is no shared
 * constant, so a change in one place has to be mirrored in the other by hand.
 * This was discussed once and it was decided that the coupling is acceptable
 * for a key that has not changed since the dashboard was written.
 */
export function cacheKey(tenant: string, deviceId: string): string {
  return tenant + '/' + deviceId
}

// for the parser tests
export { normalizeTags as _normalizeTags }
