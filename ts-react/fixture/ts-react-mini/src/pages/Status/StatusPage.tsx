import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import { RequireWrite } from '../../components/RequireWrite/RequireWrite'
import { CONFIG } from '../../config/env'
import { useServices } from '../../context/ServicesContext'
import { widgets } from '../../hooks/registry'
import { useDevices } from '../../hooks/useDevices'
import { apiClient } from '../../services/apiClient'
import { fetchStatus } from '../../services/statusApi'
import { SyncService } from '../../services/syncService'
import { type Device } from '../../types/device'
import styles from './StatusPage.module.scss'

const SYNC_RETRIES = 2

interface Counts {
  ready: number
  degraded: number
  down: number
  other: number
}

function countByStatus(devices: readonly Device[]): Counts {
  const counts: Counts = { ready: 0, degraded: 0, down: 0, other: 0 }
  for (const d of devices) {
    switch (d.status) {
      case 'READY':
        counts.ready += 1
        break
      case 'DEGRADED':
        counts.degraded += 1
        break
      case 'DOWN':
        counts.down += 1
        break
      default:
        counts.other += 1
    }
  }
  return counts
}

/** What the fleet looks like right now: the service's own line, the console's count, the widgets. */
export function StatusPage() {
  const { repo, notifier } = useServices()
  const devices = useDevices(CONFIG.pollMs)
  const status = useQuery({
    queryKey: ['status'],
    queryFn: ({ signal }) => fetchStatus(apiClient, signal),
    refetchInterval: CONFIG.pollMs
  })
  const [dryRun, setDryRun] = useState(true)
  const [synced, setSynced] = useState<number>()

  async function sync() {
    const svc = new SyncService(
      repo,
      notifier,
      CONFIG.region,
      CONFIG.batchSize,
      SYNC_RETRIES,
      dryRun
    )
    setSynced(await svc.run())
  }

  const rows = devices.data ?? []
  const counts = countByStatus(rows)
  return (
    <main className={styles.page}>
      <h1>Status</h1>
      {status.isSuccess ? (
        <p className={styles.line}>
          service: devices={status.data.devices} ready={status.data.ready} degraded=
          {status.data.degraded} down={status.data.down} other={status.data.other}
        </p>
      ) : null}
      <p className={styles.line}>
        console: devices={rows.length} ready={counts.ready} degraded={counts.degraded} down=
        {counts.down} other={counts.other}
      </p>
      <div className={styles.widgets}>
        {widgets.names().map((name) => {
          const Widget = widgets.get(name)
          return Widget === undefined ? null : (
            <Widget
              key={name}
              devices={rows}
            />
          )
        })}
      </div>
      <RequireWrite>
        <div className={styles.sync}>
          <label>
            <input
              type='checkbox'
              checked={dryRun}
              onChange={(e) => setDryRun(e.target.checked)}
            />{' '}
            dry run
          </label>
          <button
            type='button'
            onClick={() => void sync()}
          >
            Sync region {CONFIG.region}
          </button>
          {synced !== undefined && <span role='status'>synced {synced} devices</span>}
        </div>
      </RequireWrite>
    </main>
  )
}
