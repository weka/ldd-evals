import { type Snapshot } from '../types/snapshot'
import { isRecord } from '../types/typeGuards'
import { type ApiClient, ApiError, HttpStatus } from './apiClient'

function parseSnapshot(raw: unknown): Snapshot {
  if (
    !isRecord(raw) ||
    typeof raw['id'] !== 'string' ||
    typeof raw['device_id'] !== 'string' ||
    typeof raw['created_at'] !== 'string'
  ) {
    throw new ApiError(HttpStatus.BadRequest, 'snapshot: malformed record')
  }
  return { id: raw['id'], deviceId: raw['device_id'], createdAt: new Date(raw['created_at']) }
}

/** Lists the snapshots the service keeps for one device, oldest first. */
export function fetchSnapshots(
  client: ApiClient,
  deviceId: string,
  signal?: AbortSignal
): Promise<Snapshot[]> {
  return client.get(
    `/snapshots?device=${encodeURIComponent(deviceId)}`,
    (raw) => {
      if (!Array.isArray(raw)) {
        throw new ApiError(HttpStatus.BadRequest, 'snapshots: not a list')
      }
      return raw.map(parseSnapshot)
    },
    { signal }
  )
}
