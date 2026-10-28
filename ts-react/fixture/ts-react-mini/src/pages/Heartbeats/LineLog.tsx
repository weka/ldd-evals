import { type Heartbeat } from '../../types/heartbeat'
import { formatStamp } from '../../utils/time'
import styles from './LineLog.module.scss'

interface Props {
  readonly applied: readonly Heartbeat[]
}

/** The lines applied so far, newest last, as the operator typed them. */
export function LineLog({ applied }: Readonly<Props>) {
  return (
    <section>
      <h2>Applied {applied.length} lines</h2>
      <ol className={styles.log}>
        {applied.map((hb, i) => (
          <li key={`${i}-${hb.receivedAt.getTime()}`}>
            <span className={styles.stamp}>{formatStamp(hb.receivedAt)}</span> <code>{hb.raw}</code>{' '}
            <span className={styles.tenant}>{hb.tenant}</span>
          </li>
        ))}
      </ol>
    </section>
  )
}
