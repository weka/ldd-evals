import { useQuery, type UseQueryResult } from '@tanstack/react-query'

import { statusRank } from '../pages/Heartbeats/heartbeatFeed'
import { apiClient } from '../services/apiClient'
import { fetchDevices } from '../services/devicesApi'
import { type Device } from '../types/device'

/** The fleet, healthiest first, refreshed every pollMs. */
export function useDevices(
  pollMs?: number,
  headers?: Readonly<Record<string, string>>
): UseQueryResult<Device[]> {
  return useQuery({
    queryKey: ['devices'],
    queryFn: ({ signal }) => fetchDevices(apiClient, signal, headers),
    refetchInterval: pollMs,
    select: (devices) =>
      // eslint-disable-next-line sonarjs/no-misleading-array-reverse -- TODO
      devices.sort(
        (a, b) => statusRank(a.status) - statusRank(b.status) || a.id.localeCompare(b.id)
      )
  })
}
