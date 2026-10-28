import { type Cluster } from '../../types/cluster'
import { type Device } from '../../types/device'
import { AlertsTab } from './tabs/AlertsTab'
import { HeartbeatsTab } from './tabs/HeartbeatsTab'
import { OverviewTab } from './tabs/OverviewTab'
import { SnapshotsTab } from './tabs/SnapshotsTab'

export type Tab = 'overview' | 'heartbeats' | 'alerts' | 'snapshots'

interface Props {
  readonly tab: Tab
  readonly device: Device
  readonly cluster: Cluster | null
  readonly tenantId: string
  readonly clusterId: string
}

/** Picks the tab's panel. */
export function DeviceTabs({ tab, device, cluster, tenantId, clusterId }: Readonly<Props>) {
  switch (tab) {
    case 'overview':
      return (
        <OverviewTab
          device={device}
          cluster={cluster}
          tenantId={tenantId}
          clusterId={clusterId}
        />
      )
    case 'heartbeats':
      return <HeartbeatsTab device={device} />
    case 'alerts':
      return <AlertsTab device={device} />
    case 'snapshots':
      return <SnapshotsTab deviceId={device.id} />
  }
}
