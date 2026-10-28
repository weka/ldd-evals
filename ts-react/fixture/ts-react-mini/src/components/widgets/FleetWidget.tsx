import { onlineCount } from '../../services/deviceService'
import { type Device } from '../../types/device'
import styles from './FleetWidget.module.scss'

interface Props {
  readonly devices: readonly Device[]
}

/** How many devices are online, out of how many. */
export function FleetWidget({ devices }: Readonly<Props>) {
  const online = onlineCount(devices)
  return (
    <section className={styles.widget}>
      <h3>Fleet</h3>
      <p>
        <strong>{online}</strong> of {devices.length} online
      </p>
    </section>
  )
}
