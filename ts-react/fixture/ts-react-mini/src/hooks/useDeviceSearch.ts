import { useEffect, useState } from 'react'

import { useServices } from '../context/ServicesContext'
import { apiClient } from '../services/apiClient'
import { fetchDevices } from '../services/devicesApi'
import { type Device } from '../types/device'

/** The devices whose id contains query, as the operator types. */
export function useDeviceSearch(query: string): readonly Device[] {
  const { cache } = useServices()
  const [results, setResults] = useState<readonly Device[]>([])

  useEffect(() => {
    if (!query) {
      return
    }
    fetchDevices(apiClient)
      // eslint-disable-next-line promise/prefer-await-to-then -- TODO
      .then((devices) => {
        for (const d of devices) {
          cache.put(d)
        }
        setResults(devices.filter((d) => d.id.includes(query)))
        return undefined
      })
      // eslint-disable-next-line promise/prefer-await-to-then -- TODO
      .catch(() => {
        setResults([])
      })
  }, [cache, query])

  return query ? results : []
}
