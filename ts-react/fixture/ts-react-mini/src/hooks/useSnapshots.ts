import { useQuery, type UseQueryResult } from '@tanstack/react-query'

import { apiClient } from '../services/apiClient'
import { fetchSnapshots } from '../services/snapshotsApi'
import { type Snapshot } from '../types/snapshot'

/** The snapshots the service keeps for one device, oldest first. */
export function useSnapshots(deviceId: string): UseQueryResult<Snapshot[]> {
  return useQuery({
    queryKey: ['snapshots', deviceId],
    queryFn: ({ signal }) => fetchSnapshots(apiClient, deviceId, signal)
  })
}
