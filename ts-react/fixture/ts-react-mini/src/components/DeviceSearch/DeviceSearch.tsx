import { useState } from 'react'
import { Link } from 'react-router-dom'

import { useDeviceSearch } from '../../hooks/useDeviceSearch'
import styles from './DeviceSearch.module.scss'

/** The header search box: type part of an id, pick the device. */
export function DeviceSearch() {
  const [query, setQuery] = useState('')
  const results = useDeviceSearch(query)
  return (
    <div className={styles.search}>
      <label htmlFor='device-search'>Find device</label>
      <input
        id='device-search'
        type='search'
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {results.length > 0 && (
        <ul className={styles.results}>
          {results.map((d) => (
            <li key={`${d.tenant}/${d.id}`}>
              <Link to={`/devices/${d.tenant}/${d.id}`}>
                {d.tenant}/{d.id}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
