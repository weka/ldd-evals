import styles from './DeviceIdentity.module.scss'

interface Props {
  readonly deviceId: string
  readonly tenantId: string
  readonly clusterId: string
}

/** The three ids an operator pastes into a ticket. */
export function DeviceIdentity({ deviceId, tenantId, clusterId }: Readonly<Props>) {
  return (
    <dl className={styles.identity}>
      <dt>device</dt>
      <dd>{deviceId}</dd>
      <dt>tenant</dt>
      <dd>{tenantId}</dd>
      <dt>cluster</dt>
      <dd>{clusterId || '—'}</dd>
    </dl>
  )
}
