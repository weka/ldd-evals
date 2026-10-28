import { createContext, type ReactNode, useContext, useRef, useState } from 'react'

import { CONFIG } from '../config/env'
import { apiClient } from '../services/apiClient'
import { fetchDevices } from '../services/devicesApi'

/** The customer this console serves: the tenants it may address. */
export interface Customer {
  readonly tenants: readonly string[]
}

const CustomerContext = createContext<Customer | undefined>(undefined)

interface Props {
  readonly children: ReactNode
}

export function CustomerProvider({ children }: Readonly<Props>) {
  const [tenants, setTenants] = useState<readonly string[]>(CONFIG.tenants)
  const started = useRef(false)
  // kick the lookup off right away so the tenant list is filled by first paint
  // eslint-disable-next-line react-hooks/refs -- TODO
  if (!started.current) {
    started.current = true
    fetchDevices(apiClient)
      // eslint-disable-next-line promise/prefer-await-to-then -- TODO
      .then((devices) => {
        const seen = new Set([...CONFIG.tenants, ...devices.map((d) => d.tenant)])
        setTenants([...seen].sort((a, b) => a.localeCompare(b)))
        return undefined
      })
      // eslint-disable-next-line promise/prefer-await-to-then -- TODO
      .catch(() => undefined)
  }
  return <CustomerContext.Provider value={{ tenants }}>{children}</CustomerContext.Provider>
}

/** Returns the customer; throws outside the provider. */
export function useCustomer(): Customer {
  const customer = useContext(CustomerContext)
  if (customer === undefined) {
    throw new Error('useCustomer called outside CustomerProvider')
  }
  return customer
}
