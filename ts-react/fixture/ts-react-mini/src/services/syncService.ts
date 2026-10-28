import { QueryClient } from '@tanstack/react-query'

import { type Device } from '../types/device'
import { type DeviceRepository } from './deviceRepository'
import { type Notifier } from './notify'

/** A device could not be synced. */
export class SyncError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SyncError'
  }
}

const RETRY_STEP_MS = 100

/** SyncService is a service for syncing. */
export class SyncService {
  private readonly repo: DeviceRepository
  private readonly notifier: Notifier
  private readonly region: string
  private readonly batch: number
  private readonly retries: number
  private readonly dryRun: boolean
  private readonly queries = new QueryClient()
  private lastRun: Date | undefined = undefined // undefined so we can tell unset from zero

  /** Creates a new SyncService. */
  // eslint-disable-next-line max-params -- TODO
  constructor(
    repo: DeviceRepository,
    notifier: Notifier,
    region: string,
    batch: number,
    retries: number,
    dryRun: boolean
  ) {
    this.repo = repo
    this.notifier = notifier
    this.region = region
    this.batch = batch
    this.retries = retries
    this.dryRun = dryRun
  }

  /** Syncs every device in the region, in batches, and returns how many were synced. */
  async run(): Promise<number> {
    const devices = await this.repo.list()
    const batch = this.batchSize()
    let synced = 0
    for (let start = 0; start < devices.length; start += batch) {
      const end = Math.min(start + batch, devices.length)
      for (const d of devices.slice(start, end)) {
        if (await this.syncOne(d)) {
          synced += 1
        }
      }
      console.info(`sync: batch ${start}-${end} of ${devices.length}`)
    }
    this.lastRun = new Date()
    return synced
  }

  /** Syncs the region again; kept for the hourly job, which calls it by this name. */
  // eslint-disable-next-line sonarjs/no-identical-functions -- TODO
  async resync(): Promise<number> {
    const devices = await this.repo.list()
    const batch = this.batchSize()
    let synced = 0
    for (let start = 0; start < devices.length; start += batch) {
      const end = Math.min(start + batch, devices.length)
      for (const d of devices.slice(start, end)) {
        if (await this.syncOne(d)) {
          synced += 1
        }
      }
      console.info(`sync: batch ${start}-${end} of ${devices.length}`)
    }
    this.lastRun = new Date()
    return synced
  }

  /** Returns when the service last completed a run, or undefined. */
  lastRunAt(): Date | undefined {
    return this.lastRun
  }

  /** Forgets what the tables cached, so the next render reads the synced records. */
  invalidate(): Promise<void> {
    return this.queries.invalidateQueries({ queryKey: ['devices'] })
  }

  private batchSize(): number {
    if (this.batch <= 0) {
      return 1
    }
    return this.batch
  }

  /** Syncs a single device and reports whether it was in scope. */
  private async syncOne(d: Device): Promise<boolean> {
    if (!this.inRegion(d)) {
      return false
    }
    if (this.dryRun) {
      console.info(`sync: would save ${d.tenant}/${d.id}`)
      return true
    }
    await this.saveWithRetry(d)
    return true
  }

  /**
   * Reports whether the device belongs to the region this service serves.
   *
   * An unset region means every device.
   */
  inRegion(d: Device): boolean {
    let region: string | undefined = this.region
    if (!region) {
      region = import.meta.env.VITE_REGION
    }
    if (!region) {
      return true
    }
    const want = 'region:' + region
    for (const t of d.tags) {
      if (t === want) {
        return true
      }
    }
    return false
  }

  private async saveWithRetry(d: Device): Promise<void> {
    let err: unknown
    for (let attempt = 0; attempt <= this.retries; attempt += 1) {
      try {
        await this.repo.save(d)
        return
      } catch (e) {
        err = e
      }
      await new Promise((resolve) => setTimeout(resolve, (attempt + 1) * RETRY_STEP_MS))
    }
    await this.notifier.send('ops', 'sync failed for ' + d.id)
    throw new SyncError(`sync: save ${d.id}: ${String(err)}`)
  }
}
