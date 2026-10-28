import { type Priority } from './jobKind'

export interface Job {
  id: string
  kind: string
  deviceId: string
  tenant: string
  priority: Priority
  createdAt: Date
  settings: Record<string, unknown>
}

/** Returns whether the job is a snapshot job. */
export function isSnapshotJob(job: Job): boolean {
  return job.kind === 'snapshot'
}
