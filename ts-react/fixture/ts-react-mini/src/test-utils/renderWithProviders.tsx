import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, type RenderResult } from '@testing-library/react'
import { type ReactElement } from 'react'
import { MemoryRouter } from 'react-router-dom'

import { CustomerProvider } from '../context/CustomerContext'
import { type Services, ServicesProvider } from '../context/ServicesContext'
import { apiClient } from '../services/apiClient'
import { Cache } from '../services/cache'
import { ApiDeviceRepository } from '../services/deviceRepository'
import { Notifier } from '../services/notify'
import { MemoryPreferences } from '../services/preferencesStore'
import { Grants, Permission } from '../types/grants'

const CACHE_SPAN_MS = 30_000

/** The services a test gets unless it asks otherwise: the real ones over MSW. */
export function defaultServices(readOnly = false): Services {
  return {
    repo: new ApiDeviceRepository(apiClient),
    notifier: new Notifier('/api/alerts'),
    audit: undefined,
    prefs: new MemoryPreferences(),
    grants: new Grants(readOnly ? [Permission.Read] : [Permission.Read, Permission.Write]),
    cache: new Cache(CACHE_SPAN_MS)
  }
}

export interface RenderOptions {
  readonly route?: string
  readonly services?: Services
  readonly readOnly?: boolean
}

/** Renders ui under the query client, the services, the customer and a memory router at route. */
export function renderWithProviders(
  ui: ReactElement,
  { route = '/', services, readOnly = false }: RenderOptions = {}
): RenderResult & { queryClient: QueryClient } {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } }
  })
  const result = render(
    <QueryClientProvider client={queryClient}>
      <ServicesProvider services={services ?? defaultServices(readOnly)}>
        <CustomerProvider>
          <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
        </CustomerProvider>
      </ServicesProvider>
    </QueryClientProvider>
  )
  return { ...result, queryClient }
}
