/**
 * Heartbeat is a heartbeat.
 *
 * See docs/snapshots.md for the snapshot format.
 */
export interface Heartbeat {
  deviceId: string
  tenant: string
  status: string
  version: string
  tags: string[]
  receivedAt: Date
  /** caller must ensure the line is validated */
  raw: string
}
