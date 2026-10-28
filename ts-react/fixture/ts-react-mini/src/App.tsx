import './components/widgets'

import { Navigate, Route, Routes } from 'react-router-dom'

import { Layout } from './components/Layout/Layout'
import { useSnapshotScheduler } from './hooks/useSnapshotScheduler'
import { DevicesPage } from './pages/Devices/DevicesPage'
import { DeviceView } from './pages/DeviceView/DeviceView'
import { HeartbeatsPage } from './pages/Heartbeats/HeartbeatsPage'
import { SettingsPage } from './pages/Settings/SettingsPage'
import { StatusPage } from './pages/Status/StatusPage'
import { ROUTES } from './routes'

/** The page tree; the router and the providers around it live in main.tsx. */
export function App() {
  useSnapshotScheduler()
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route
          path={ROUTES.home}
          element={
            <Navigate
              to={ROUTES.devices}
              replace
            />
          }
        />
        <Route
          path={ROUTES.devices}
          element={<DevicesPage />}
        />
        <Route
          path={ROUTES.device}
          element={<DeviceView />}
        />
        <Route
          path={ROUTES.heartbeats}
          element={<HeartbeatsPage />}
        />
        <Route
          path={ROUTES.status}
          element={<StatusPage />}
        />
        <Route
          path={ROUTES.settings}
          element={<SettingsPage />}
        />
      </Route>
    </Routes>
  )
}
