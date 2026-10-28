import { useSnapshots } from '../../../hooks/useSnapshots'
import { formatStamp } from '../../../utils/time'
import styles from './SnapshotsTab.module.scss'

interface Props {
  readonly deviceId: string
}

/** The snapshots the service keeps for the device, oldest first. */
export function SnapshotsTab({ deviceId }: Readonly<Props>) {
  const snapshots = useSnapshots(deviceId)
  if (snapshots.isPending) {
    return <p>loading…</p>
  }
  if (snapshots.isError) {
    return <p role='alert'>snapshots unavailable</p>
  }
  if (snapshots.data.length === 0) {
    return <p>no snapshots yet</p>
  }
  return (
    <ul className={styles.list}>
      {snapshots.data.map((s) => (
        <li key={s.id}>
          <code>{s.id}</code> {formatStamp(s.createdAt)}
        </li>
      ))}
    </ul>
  )
}
