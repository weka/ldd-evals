import clsx from 'clsx'
import { Link } from 'react-router-dom'

import { type Device } from '../../types/device'
import { formatStamp } from '../../utils/time'
import { StatusBadge } from '../StatusBadge/StatusBadge'
import styles from './DeviceTable.module.scss'

interface Props {
  devices: readonly Device[]
  showTenant: boolean
  compact: boolean
  showTags: boolean
  onPlace?: (d: Device) => void
}

/** The fleet as rows: id, status, version, last seen, and the columns the page asks for. */
// eslint-disable-next-line sonarjs/prefer-read-only-props -- TODO
export function DeviceTable({ devices, showTenant, compact, showTags, onPlace }: Props) {
  return (
    <table className={clsx(styles.table, compact && styles.compact)}>
      <thead>
        <tr>
          {showTenant ? <th>Tenant</th> : null}
          <th>Device</th>
          <th>Status</th>
          {!compact && <th>Version</th>}
          {showTags ? <th>Tags</th> : null}
          <th>Last seen</th>
          {onPlace !== undefined && <th />}
        </tr>
      </thead>
      <tbody>
        {devices.map((d) => (
          <tr key={`${d.tenant}/${d.id}`}>
            {showTenant ? <td>{d.tenant}</td> : null}
            <td>
              <Link to={`/devices/${encodeURIComponent(d.tenant)}/${encodeURIComponent(d.id)}`}>
                {d.id}
              </Link>
            </td>
            <td>
              <StatusBadge status={d.status} />
            </td>
            {!compact && <td>{d.version}</td>}
            {showTags ? <td>{d.tags.join(', ')}</td> : null}
            <td>{formatStamp(d.lastSeen)}</td>
            {onPlace !== undefined && (
              <td>
                <button
                  type='button'
                  onClick={() => onPlace(d)}
                >
                  Place replicas
                </button>
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
