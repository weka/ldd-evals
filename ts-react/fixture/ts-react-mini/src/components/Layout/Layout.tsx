import { NavLink, Outlet } from 'react-router-dom'

import { ROUTES } from '../../routes'
import { DeviceSearch } from '../DeviceSearch/DeviceSearch'
import styles from './Layout.module.scss'

const NAV: ReadonlyArray<readonly [string, string]> = [
  [ROUTES.devices, 'Devices'],
  [ROUTES.heartbeats, 'Heartbeats'],
  [ROUTES.status, 'Status'],
  [ROUTES.settings, 'Settings']
]

/** The frame every page renders in: the navigation, the search box and the page itself. */
export function Layout() {
  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <span className={styles.brand}>Fleet</span>
        <nav aria-label='Pages'>
          {NAV.map(([to, label]) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => (isActive ? styles.active : undefined)}
            >
              {label}
            </NavLink>
          ))}
        </nav>
        <DeviceSearch />
      </header>
      <Outlet />
    </div>
  )
}
