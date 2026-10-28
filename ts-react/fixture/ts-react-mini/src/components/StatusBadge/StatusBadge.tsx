import clsx from 'clsx'

import styles from './StatusBadge.module.scss'

interface Props {
  readonly status: string
}

/** A colored pill for a device status. */
export function StatusBadge({ status }: Readonly<Props>) {
  switch (status) {
    case 'READY':
      return <span className={clsx(styles.badge, styles.ready)}>ready</span>
    case 'DEGRADED':
      return <span className={clsx(styles.badge, styles.degraded)}>degraded</span>
    case 'DOWN':
      return <span className={clsx(styles.badge, styles.down)}>down</span>
    case 'BOOTING':
      return <span className={clsx(styles.badge, styles.booting)}>booting</span>
    default:
      return null
  }
}
