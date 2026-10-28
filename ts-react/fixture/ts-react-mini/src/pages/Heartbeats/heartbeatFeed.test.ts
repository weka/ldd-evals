import { describe, expect, it, vi } from 'vitest'

import { Notifier } from '../../services/notify'
import { type Device } from '../../types/device'
import {
  _normalizeTags,
  AuditLog,
  FeedStore,
  parseLine,
  processHeartbeat,
  ScratchFleet,
  statusRank
} from './heartbeatFeed'

function feedWith(notifier: Notifier = new Notifier('')): FeedStore {
  return new FeedStore(new ScratchFleet(), notifier, new AuditLog(undefined))
}

function device(overrides: Partial<Device> = {}): Device {
  return {
    id: 'd1',
    tenant: 'acme',
    status: 'READY',
    version: '1.0',
    tags: ['a', 'b'],
    lastSeen: new Date('2024-01-02T03:04:05Z'),
    ...overrides
  }
}

describe('parseLine', () => {
  it('normalizes the tags', () => {
    const [, status, version, tags, err] = parseLine(
      'dev-1|ready|1.2.3|a, b ,a,region:eu,region:zz'
    )
    expect(err).toBeUndefined()
    expect([status, version]).toEqual(['READY', '1.2.3'])
    expect(tags).toEqual(['a', 'b', 'region:eu'])
  })
})

describe('normalizeTags', () => {
  it('trims, dedupes and drops unknown region codes', () => {
    expect(_normalizeTags([' a ', 'b', 'a', '', 'region:eu', 'region:xx', 'region:'])).toEqual([
      'a',
      'b',
      'region:eu'
    ])
  })
})

describe('processHeartbeat', () => {
  it('notifies the ops channel once per DOWN transition', async () => {
    const notifier = new Notifier('')
    const send = vi.spyOn(notifier, 'send').mockResolvedValue(undefined)
    const feed = feedWith(notifier)
    await processHeartbeat(feed, 'dev-1|down|1.0', 'acme', false)
    await processHeartbeat(feed, 'dev-1|down|1.0', 'acme', false)
    expect(send).toHaveBeenCalledTimes(1)
    expect(send).toHaveBeenCalledWith('ops', 'device dev-1 is down')
  })

  it('records the device in the scratch fleet', async () => {
    const feed = feedWith()
    const [id, score, changed] = await processHeartbeat(feed, 'dev-9|ready|2.0', 'acme', false)
    expect([id, score, changed]).toEqual(['dev-9', 100, true])
    expect(feed.repo.get('acme', 'dev-9').version).toBe('2.0')
  })
})

describe('FeedStore', () => {
  it('summarizes a device', () => {
    const got = feedWith().summarize(device())
    for (const want of [
      'acme/d1',
      'status=READY',
      'version=1.0',
      'tags=a,b',
      'last_seen=2024-01-02T03:04:05Z',
      'online'
    ]) {
      expect(got).toContain(want)
    }
  })

  it('renders short and long forms', () => {
    const feed = feedWith()
    const d = device({ status: 'DOWN' })
    expect(feed.render(d, true)).toBe('d1 DOWN')
    expect(feed.render(d, false)).toContain('status=DOWN')
  })

  it('scores by status and tags', () => {
    const feed = feedWith()
    const now = new Date()
    expect(feed.score(device({ tags: ['a'], lastSeen: now }))).toBe(110)
    expect(feed.score(device({ status: 'DEGRADED', tags: [], lastSeen: now }))).toBe(50)
    expect(feed.score(device({ status: 'DOWN', lastSeen: now }))).toBe(0)
  })

  it('caches what it gets', () => {
    const feed = feedWith()
    feed.repo.save(device())
    for (let i = 0; i < 2; i += 1) {
      expect(feed.get('acme', 'd1').status).toBe('READY')
    }
    const st = feed.stats()
    expect([st.hits, st.misses, st.cached]).toEqual([1, 1, 1])
    expect(() => feed.get('acme', 'missing')).toThrow('get acme/missing')
  })

  it('ranks statuses for the table', () => {
    expect(['READY', 'DEGRADED', 'BOOTING', 'DOWN', 'odd'].map(statusRank)).toEqual([
      0, 1, 2, 3, -1
    ])
  })
})
