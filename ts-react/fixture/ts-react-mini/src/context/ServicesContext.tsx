import { createContext, type ReactNode, useContext } from 'react'

import { type Cache } from '../services/cache'
import { type DeviceRepository } from '../services/deviceRepository'
import { type Notifier } from '../services/notify'
import { type PreferencesStore } from '../services/preferencesStore'
import { type Grants } from '../types/grants'

/** Everything the pages need that the composition root builds once. */
export interface Services {
  /** The repository is an interface so tests can swap it for a double. */
  readonly repo: DeviceRepository
  readonly notifier: Notifier
  /** Where audit lines go; undefined drops them. */
  readonly audit: ((line: string) => void) | undefined
  readonly prefs: PreferencesStore
  readonly grants: Grants
  readonly cache: Cache
}

const ServicesContext = createContext<Services | undefined>(undefined)

interface Props {
  readonly services: Services
  readonly children: ReactNode
}

export function ServicesProvider({ services, children }: Readonly<Props>) {
  return <ServicesContext.Provider value={services}>{children}</ServicesContext.Provider>
}

/** Returns the services the app was started with; throws outside the provider. */
export function useServices(): Services {
  const services = useContext(ServicesContext)
  if (services === undefined) {
    throw new Error('useServices called outside ServicesProvider')
  }
  return services
}
