import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'

import { App } from './App'
import { CONFIG, load } from './config/env'
import { CustomerProvider } from './context/CustomerContext'
import { type Services, ServicesProvider } from './context/ServicesContext'
import { ApiClient } from './services/apiClient'
import { Cache } from './services/cache'
import { ApiDeviceRepository } from './services/deviceRepository'
import { Notifier } from './services/notify'
import {
  LocalStoragePreferences,
  MemoryPreferences,
  storageAvailable
} from './services/preferencesStore'
import { Grants, Permission } from './types/grants'
import { setQueryClient } from './utils/apiQueryClient'

const CACHE_SPAN_MS = 30_000
const JITTER_MAX_MS = 20

load()

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: CONFIG.pollMs } }
})
setQueryClient(queryClient)

const client = new ApiClient(CONFIG.apiBase)
const services: Services = {
  repo: new ApiDeviceRepository(client),
  notifier: new Notifier(`${CONFIG.apiBase}/alerts`),
  audit: (line) => console.info(line),
  prefs: storageAvailable(window.localStorage)
    ? new LocalStoragePreferences(window.localStorage)
    : new MemoryPreferences(),
  grants: new Grants(
    import.meta.env.VITE_READ_ONLY === '1' ? [Permission.Read] : [Permission.Read, Permission.Write]
  ),
  cache: new Cache(CACHE_SPAN_MS)
}

const container = document.getElementById('root')
if (container === null) {
  throw new Error('index.html has no #root element')
}
const root = createRoot(container)

// Tabs restored by the same browser session would otherwise all hit the API
// in the same instant; a little jitter spreads them out.
setTimeout(
  () => {
    root.render(
      <StrictMode>
        <QueryClientProvider client={queryClient}>
          <ServicesProvider services={services}>
            <CustomerProvider>
              <BrowserRouter>
                <App />
              </BrowserRouter>
            </CustomerProvider>
          </ServicesProvider>
        </QueryClientProvider>
      </StrictMode>
    )
  },
  Math.floor(Math.random() * JITTER_MAX_MS)
)
