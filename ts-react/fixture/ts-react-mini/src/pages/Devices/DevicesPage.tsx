import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { DeviceTable } from '../../components/DeviceTable/DeviceTable'
import { RequireWrite } from '../../components/RequireWrite/RequireWrite'
import { CONFIG } from '../../config/env'
import { useDevices } from '../../hooks/useDevices'
import { type Device } from '../../types/device'
import { DeviceForm } from './DeviceForm'
import styles from './DevicesPage.module.scss'
import { type Node } from './placement/picker'
import { PlacementDialog } from './PlacementDialog'
import { traceFromSearch, withTrace } from './trace'
import { useTableFilters } from './useTableFilters'

// The storage nodes replicas can land on; the placement service will own this list.
const NODES: readonly Node[] = [
  { id: 'eu-a', zone: 'eu', capacity: 12 },
  { id: 'eu-b', zone: 'eu', capacity: 4 },
  { id: 'us-a', zone: 'us', capacity: 9 },
  { id: 'ap-a', zone: 'ap', capacity: 6 }
]

/** The fleet table with its URL-driven filters, the registration form and the placement dialog. */
export function DevicesPage() {
  const filters = useTableFilters()
  const [params] = useSearchParams()
  const devices = useDevices(CONFIG.pollMs, withTrace({}, traceFromSearch(params)))
  const [placing, setPlacing] = useState<Device>()

  const rows = (devices.data ?? []).filter(
    (d) =>
      (!filters.tenant || d.tenant === filters.tenant) &&
      (!filters.status || d.status === filters.status)
  )

  return (
    <main className={styles.page}>
      <h1>Devices</h1>
      <div className={styles.filters}>
        <label htmlFor='filter-tenant'>Tenant</label>
        <input
          id='filter-tenant'
          value={filters.tenant}
          onChange={(e) => filters.setTenant(e.target.value)}
        />
        <label htmlFor='filter-status'>Status</label>
        <select
          id='filter-status'
          value={filters.status}
          onChange={(e) => filters.setStatus(e.target.value)}
        >
          <option value=''>any</option>
          <option value='READY'>ready</option>
          <option value='DEGRADED'>degraded</option>
          <option value='DOWN'>down</option>
          <option value='BOOTING'>booting</option>
        </select>
      </div>
      {devices.isPending ? <p>loading…</p> : null}
      {devices.isError ? <p role='alert'>store unavailable</p> : null}
      {devices.isSuccess ? (
        <DeviceTable
          devices={rows}
          showTenant
          compact={false}
          showTags
          onPlace={setPlacing}
        />
      ) : null}
      {placing !== undefined && (
        <PlacementDialog
          device={placing}
          nodes={NODES}
          onClose={() => setPlacing(undefined)}
        />
      )}
      <RequireWrite>
        <DeviceForm onRegistered={() => void devices.refetch()} />
      </RequireWrite>
    </main>
  )
}
