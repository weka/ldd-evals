import { useState } from 'react'

import { RequireWrite } from '../../../components/RequireWrite/RequireWrite'
import { StatusBadge } from '../../../components/StatusBadge/StatusBadge'
import { type Cluster } from '../../../types/cluster'
import { type Device } from '../../../types/device'
import { formatStamp } from '../../../utils/time'
import { DeviceIdentity } from '../DeviceIdentity'
import styles from './OverviewTab.module.scss'

interface Props {
  readonly device: Device
  readonly cluster: Cluster | null | undefined
  readonly tenantId: string
  readonly clusterId: string
}

/** The device's record and the cluster it is enrolled in. */
export function OverviewTab({ device: initial, cluster, tenantId, clusterId }: Readonly<Props>) {
  const [device, setDevice] = useState(initial)

  function markDown() {
    setDevice((d) => {
      d.status = 'DOWN'
      d.lastSeen = new Date()
      return d
    })
  }

  return (
    <section className={styles.overview}>
      <DeviceIdentity
        deviceId={device.id}
        tenantId={tenantId}
        clusterId={clusterId}
      />
      <p>
        <StatusBadge status={device.status} /> version {device.version || '—'}, last seen{' '}
        {formatStamp(device.lastSeen)}
      </p>
      <p>tags: {device.tags.length > 0 ? device.tags.join(', ') : 'none'}</p>
      <h2>Cluster</h2>
      {cluster ? <p>{cluster.name}</p> : <p>not enrolled</p>}
      <RequireWrite>
        <button
          type='button'
          onClick={markDown}
        >
          Mark down
        </button>
      </RequireWrite>
    </section>
  )
}
