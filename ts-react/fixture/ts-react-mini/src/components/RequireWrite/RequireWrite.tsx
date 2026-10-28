import { type ReactNode } from 'react'

import { useServices } from '../../context/ServicesContext'
import { Permission } from '../../types/grants'
import styles from './RequireWrite.module.scss'

interface Props {
  readonly children: ReactNode
}

/**
 * Renders its children only when the console holds write permission; a
 * read-only console keeps every table while each mutating control is replaced
 * by the reason it is missing.
 */
export function RequireWrite({ children }: Readonly<Props>) {
  const { grants } = useServices()
  if (!grants.has(Permission.Write)) {
    return <span className={styles.denied}>write permission required</span>
  }
  return <>{children}</>
}
