import { type Snapshot } from '../../types/snapshot'
import { retentionDays } from './config'
import { applyPolicy } from './policy'
import { type SnapshotRepository } from './repository'
import { type WindowPlan } from './schedule'
import { newSnapshot } from './snapshot'

function clockOf(t: Date): string {
  return t.toISOString().slice('YYYY-MM-DDT'.length, 'YYYY-MM-DDTHH:MM'.length)
}

/** Decides when a device is snapshotted and when its old snapshots go away. */
export class SnapshotScheduler {
  private readonly now: () => Date
  private pending: string[] = []

  /** Builds a scheduler over store that honors plan and reads the current time from now. */
  constructor(
    private readonly store: SnapshotRepository,
    private readonly plan: WindowPlan,
    now: (() => Date) | undefined
  ) {
    if (!now) {
      throw new Error('scheduler: no clock')
    }
    this.now = now
  }

  /**
   * Records a new snapshot for deviceId.
   *
   * The plan must be open and the retention config usable.
   */
  take(raw: Record<string, string>, deviceId: string): Snapshot {
    const now = this.now()
    if (!this.plan.open(now)) {
      throw new Error(`scheduler: plan closed at ${clockOf(now)}`)
    }
    if (retentionDays(raw) === 0) {
      throw new Error('scheduler: retention unset, snapshots would never expire')
    }
    const sn = newSnapshot(deviceId, now)
    this.store.put(sn)
    return sn
  }

  /**
   * Deletes the snapshots of deviceId that the retention policy in raw has expired.
   *
   * Returns the deleted records.
   */
  prune(raw: Record<string, string>, deviceId: string): Snapshot[] {
    const snaps = this.store.listFor(deviceId)
    const expired = applyPolicy(this.now(), raw, snaps)
    for (const sn of expired) {
      this.store.delete(sn.id)
    }
    return expired
  }

  /** Notes that deviceId reported and is due for a snapshot on the next tick. */
  request(deviceId: string): void {
    if (!this.pending.includes(deviceId)) {
      this.pending.push(deviceId)
    }
  }

  /** Hands out the devices due for a snapshot and forgets them; every caller wants both. */
  drainPending(): string[] {
    const out = this.pending
    this.pending = []
    return out
  }
}
