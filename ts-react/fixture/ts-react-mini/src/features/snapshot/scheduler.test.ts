import { beforeEach, describe, expect, it } from 'vitest'

import { SnapshotRepository } from './repository'
import { Window, WindowPlan } from './schedule'
import { SnapshotScheduler } from './scheduler'
import { newSnapshot } from './snapshot'

const DAY = 86_400_000
const now = new Date('2024-03-01T12:00:00Z')

function scheduler(): [SnapshotScheduler, SnapshotRepository] {
  const store = new SnapshotRepository(window.localStorage, 'snaps')
  const plan = new WindowPlan([Window.parse('00:00', '23:59')])
  return [new SnapshotScheduler(store, plan, () => now), store]
}

function storedIds(store: SnapshotRepository, deviceId: string): string[] {
  return store.listFor(deviceId).map((sn) => sn.id)
}

describe('SnapshotScheduler', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('prune deletes the expired snapshots of one device', () => {
    const [sched, store] = scheduler()
    const old = newSnapshot('dev-1', new Date(now.getTime() - 40 * DAY))
    const fresh = newSnapshot('dev-1', new Date(now.getTime() - 2 * DAY))
    const other = newSnapshot('dev-2', new Date(now.getTime() - 40 * DAY))
    for (const sn of [old, fresh, other]) {
      store.put(sn)
    }

    const expired = sched.prune({ retention: '30d' }, 'dev-1')

    expect(expired.map((sn) => sn.id)).toEqual([old.id])
    expect(storedIds(store, 'dev-1')).toEqual([fresh.id])
    expect(storedIds(store, 'dev-2')).toEqual([other.id])
  })

  it('prune keeps everything inside the retention', () => {
    const [sched, store] = scheduler()
    store.put(newSnapshot('dev-1', new Date(now.getTime() - 6 * DAY)))
    expect(sched.prune({ retention: '7d' }, 'dev-1')).toEqual([])
  })

  it('take records a snapshot', () => {
    const [sched, store] = scheduler()
    const sn = sched.take({ retention: '30d' }, 'dev-1')
    expect([sn.deviceId, sn.createdAt]).toEqual(['dev-1', now])
    expect(storedIds(store, 'dev-1')).toEqual([sn.id])
  })

  it('rejects a missing clock', () => {
    const store = new SnapshotRepository(window.localStorage, 'snaps')
    expect(
      () =>
        new SnapshotScheduler(store, new WindowPlan([Window.parse('00:00', '23:59')]), undefined)
    ).toThrow('clock')
  })

  it('drains what was requested, once', () => {
    const [sched] = scheduler()
    sched.request('dev-1')
    sched.request('dev-1')
    sched.request('dev-2')
    expect(sched.drainPending()).toEqual(['dev-1', 'dev-2'])
    expect(sched.drainPending()).toEqual([])
  })
})
