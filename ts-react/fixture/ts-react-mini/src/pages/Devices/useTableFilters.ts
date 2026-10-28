import { useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'

/** The device table's filters, kept in the URL so a filtered view can be shared. */
export interface TableFilters {
  readonly tenant: string
  readonly status: string
  readonly setTenant: (tenant: string) => void
  readonly setStatus: (status: string) => void
}

export function useTableFilters(): TableFilters {
  const [params, setParams] = useSearchParams()
  const update = useCallback(
    (key: string, value: string) => {
      setParams((prev) => {
        const next = new URLSearchParams(prev)
        if (value) {
          next.set(key, value)
        } else {
          next.delete(key)
        }
        return next
      })
    },
    [setParams]
  )
  return {
    tenant: params.get('tenant') ?? '',
    status: params.get('status') ?? '',
    setTenant: (tenant) => {
      update('tenant', tenant)
    },
    setStatus: (status) => {
      update('status', status)
    }
  }
}
