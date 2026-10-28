import { quietest } from '../../services/deviceService'
import { type Device } from '../../types/device'
import { formatStamp } from '../../utils/time'
import styles from './UptimeWidget.module.scss'

interface Props {
  readonly devices: readonly Device[]
}

/** The device that reported least recently; the first one to worry about. */
export function UptimeWidget({ devices }: Readonly<Props>) {
  const oldest = quietest(devices)
  return (
    <section className={styles.widget}>
      <h3>Quietest</h3>
      {oldest === undefined ? (
        <p>no devices</p>
      ) : (
        <p>
          {oldest.tenant}/{oldest.id} at {formatStamp(oldest.lastSeen)}
        </p>
      )}
    </section>
  )
}
