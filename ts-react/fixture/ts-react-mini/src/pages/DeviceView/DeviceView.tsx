import { useQuery } from '@tanstack/react-query'
import { useParams, useSearchParams } from 'react-router-dom'

import { apiClient, ApiError, HttpStatus } from '../../services/apiClient'
import { fetchDevice } from '../../services/devicesApi'
import { clusterFromTags } from '../../types/cluster'
import { DeviceTabs, type Tab } from './DeviceTabs'
import styles from './DeviceView.module.scss'

const TABS: readonly Tab[] = ['overview', 'heartbeats', 'alerts', 'snapshots']

/** One device: its overview, heartbeats, alerts and snapshots, under tabs kept in the URL. */
export function DeviceView() {
  const { tenant = '', id = '' } = useParams()
  const [search, setSearch] = useSearchParams()
  const tab = asTab(search.get('tab'))
  const device = useQuery({
    queryKey: ['device', tenant, id],
    queryFn: ({ signal }) => fetchDevice(apiClient, tenant, id, signal)
  })

  // eslint-disable-next-line react/no-unstable-nested-components, react/no-multi-comp -- TODO
  function TabButton({ name }: Readonly<{ name: Tab }>) {
    return (
      <button
        type='button'
        role='tab'
        aria-selected={tab === name}
        onClick={() => setSearch({ tab: name })}
      >
        {name}
      </button>
    )
  }

  if (device.isPending) {
    return <p>loading…</p>
  }
  if (device.isError) {
    const err = device.error
    if (err instanceof ApiError && err.status === HttpStatus.NotFound) {
      return (
        <p role='alert'>
          no device {tenant}/{id}
        </p>
      )
    }
    return <p role='alert'>store unavailable</p>
  }
  const cluster = clusterFromTags(device.data.tags)
  return (
    <main className={styles.page}>
      <h1>
        {tenant}/{id}
      </h1>
      <div
        role='tablist'
        className={styles.tabs}
      >
        {TABS.map((name) => (
          <TabButton
            key={name}
            name={name}
          />
        ))}
      </div>
      <DeviceTabs
        tab={tab}
        device={device.data}
        cluster={cluster}
        tenantId={tenant}
        clusterId={cluster?.id ?? ''}
      />
    </main>
  )
}

function asTab(raw: string | null): Tab {
  return (TABS as readonly string[]).includes(raw ?? '') ? (raw as Tab) : 'overview'
}
