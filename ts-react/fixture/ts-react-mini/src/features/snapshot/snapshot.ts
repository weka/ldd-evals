import { type Snapshot } from '../../types/snapshot'

const MS_PER_SECOND = 1000

/**
 * Builds the snapshot record for deviceId taken at the given time.
 *
 * The id embeds the device and the second so two ticks never collide in storage.
 */
export function newSnapshot(deviceId: string, at: Date): Snapshot {
  return { id: `${deviceId}-${Math.floor(at.getTime() / MS_PER_SECOND)}`, createdAt: at, deviceId }
}
