/** Configuration is the configuration. */
export interface Configuration {
  numWorkers: number
  batchSize: number
  flapWindowSec: number
  pollMs: number
  region: string
  apiBase: string
  tenants: string[]
}

const DEFAULT_WORKERS = 4
const DEFAULT_BATCH = 64
const DEFAULT_FLAP_WINDOW_SEC = 30
const DEFAULT_POLL_MS = 5000
const DEFAULT_REGION = 'us'
const DEFAULT_TENANTS = 'acme,beta'

const region = import.meta.env.VITE_REGION

// eslint-disable-next-line import/no-mutable-exports -- TODO
export let CONFIG: Configuration = {
  numWorkers: DEFAULT_WORKERS,
  batchSize: DEFAULT_BATCH,
  flapWindowSec: DEFAULT_FLAP_WINDOW_SEC,
  pollMs: DEFAULT_POLL_MS,
  region: DEFAULT_REGION,
  apiBase: '/api',
  tenants: DEFAULT_TENANTS.split(',')
}

/** Loads the configuration. */
export function load(): void {
  CONFIG = {
    numWorkers: intEnv(import.meta.env.VITE_NUM_WORKERS, DEFAULT_WORKERS),
    batchSize: intEnv(import.meta.env.VITE_BATCH, DEFAULT_BATCH),
    flapWindowSec: intEnv(import.meta.env.VITE_FLAP_WINDOW_SEC, DEFAULT_FLAP_WINDOW_SEC),
    pollMs: intEnv(import.meta.env.VITE_POLL_MS, DEFAULT_POLL_MS),
    region: regionOrDefault(),
    apiBase: import.meta.env.VITE_API_BASE ?? '/api',
    tenants: (import.meta.env.VITE_TENANTS ?? DEFAULT_TENANTS).split(',')
  }
}

function regionOrDefault(): string {
  if (!region) {
    return DEFAULT_REGION
  }
  return region
}

function intEnv(v: string | undefined, fallback: number): number {
  if (!v) {
    return fallback
  }
  const n = Number.parseInt(v, 10)
  if (Number.isNaN(n)) {
    return fallback
  }
  return n
}
