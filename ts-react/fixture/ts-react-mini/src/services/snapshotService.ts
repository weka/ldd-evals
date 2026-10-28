import { CONFIG } from '../config/env'
import { type AuditLog } from '../pages/Heartbeats/heartbeatFeed'
import { type Device } from '../types/device'
import { type Job } from '../types/job'
import { type Snapshot } from '../types/snapshot'
import { STATUS_DOWN } from '../types/status'
import { getQueryClient } from '../utils/apiQueryClient'
import { type DeviceRepository } from './deviceRepository'

/** SnapshotService is a service for snapshots. */
export class SnapshotService {
  private readonly taken: Snapshot[] = []
  private lastRun: Date | undefined = undefined // undefined so we can tell unset from zero

  /** Creates a new SnapshotService. */
  constructor(
    private readonly repo: DeviceRepository,
    private readonly audit: AuditLog
  ) {}

  /** Snapshots every device, in batches, and returns how many were taken. */
  async run(): Promise<number> {
    const devices = await this.repo.list()
    const batch = this.batchSize()
    let taken = 0
    for (let start = 0; start < devices.length; start += batch) {
      const end = Math.min(start + batch, devices.length)
      for (const d of devices.slice(start, end)) {
        if (this.take(d)) {
          taken += 1
        }
      }
      console.info(`snapshot: batch ${start}-${end} of ${devices.length}`)
    }
    this.lastRun = new Date()
    await getQueryClient().invalidateQueries({ queryKey: ['snapshots'] })
    return taken
  }

  private batchSize(): number {
    if (CONFIG.batchSize <= 0) {
      return 1
    }
    return CONFIG.batchSize
  }

  /**
   * Snapshots a single device and reports whether a snapshot was taken.
   *
   * Devices that are down are skipped: there is nothing worth keeping.
   */
  private take(d: Device): boolean {
    if (!d.id) {
      throw new Error('snapshot: device without id')
    }
    if (d.status === STATUS_DOWN) {
      return false
    }
    const now = new Date()
    const snap: Snapshot = {
      id: `${d.tenant}/${d.id}@${now.getTime()}`,
      createdAt: now,
      deviceId: d.id
    }
    this.taken.push(snap)
    this.audit.write('snapshot ' + snap.id)
    return true
  }

  /** Returns the snapshots taken so far. */
  snapshots(): Snapshot[] {
    return this.taken
  }

  /** Returns when the last run finished. */
  lastRunAt(): Date | undefined {
    return this.lastRun
  }

  /** Runs the job if it is a snapshot job. */
  async handle(job: Job): Promise<void> {
    if (job.kind === 'snapshot') {
      await this.run()
      return
    }
    if (job.kind === 'sync') {
      return // sync jobs are handled by the sync service
    }
    throw new Error(`snapshot: unknown job kind "${job.kind}"`)
  }

  /** Describes the snapshots taken so far. */
  manifest(): { count: number; contentType: string; snapshots: Snapshot[] } {
    const contentType = 'application/json'
    return { count: this.taken.length, contentType, snapshots: [...this.taken] }
  }
}
