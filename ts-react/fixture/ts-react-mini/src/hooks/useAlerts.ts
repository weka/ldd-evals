import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { useEffect } from 'react'

import { fetchAlerts, type RaisedAlert } from '../services/alertsApi'
import { apiClient } from '../services/apiClient'

/**
 * The alerts the service has sent, refreshed every pollMs and whenever the
 * operator comes back to the tab: an alert that fired while the window was in
 * the background should be on screen before the next poll.
 */
export function useAlerts(pollMs?: number): UseQueryResult<RaisedAlert[]> {
  const query = useQuery({
    queryKey: ['alerts'],
    queryFn: ({ signal }) => fetchAlerts(apiClient, signal),
    refetchInterval: pollMs
  })
  const { refetch } = query

  useEffect(() => {
    const onFocus = () => {
      void refetch()
    }
    window.addEventListener('focus', onFocus)
    return () => {
      window.removeEventListener('focus', onFocus)
    }
  }, [refetch])

  return query
}
