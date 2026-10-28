/**
 * The snapshot feature end to end.
 *
 * When a device may be snapshotted (WindowPlan), how long a snapshot is kept
 * (the retention policy) and where it lives in the browser (SnapshotRepository).
 * Everything the feature needs sits in this one folder so a scheduler change is
 * a single folder's diff and the whole thing can be exercised against a scratch
 * Storage, without the rest of the dashboard. The heartbeat path only tells it
 * which device just reported.
 * See docs/heartbeat-protocol.md for the heartbeat line format.
 */
export { retentionDays } from './config'
export { applyPolicy } from './policy'
export { SnapshotRepository } from './repository'
export { Window, WindowPlan } from './schedule'
export { SnapshotScheduler } from './scheduler'
export { newSnapshot } from './snapshot'
