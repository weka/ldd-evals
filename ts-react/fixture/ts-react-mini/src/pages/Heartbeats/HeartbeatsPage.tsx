import { type FormEvent, useState } from 'react'

import { RequireWrite } from '../../components/RequireWrite/RequireWrite'
import { useCustomer } from '../../context/CustomerContext'
import styles from './HeartbeatsPage.module.scss'
import { LineLog } from './LineLog'
import { ResultPanel } from './ResultPanel'
import { useHeartbeatSimulator } from './useHeartbeatSimulator'

/**
 * The heartbeat simulator: paste one line, pick the tenant header, tick force,
 * and read what the service would answer.
 */
export function HeartbeatsPage() {
  const { tenants } = useCustomer()
  const sim = useHeartbeatSimulator()
  const [line, setLine] = useState('')
  const [tenant, setTenant] = useState('')
  const [force, setForce] = useState(false)

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    void sim.apply({ line, tenant, force })
  }

  return (
    <main className={styles.page}>
      <h1>Heartbeats</h1>
      <p className={styles.hint}>
        Lines run against a scratch copy of the fleet; nothing is sent to the service except the
        alert a DOWN transition raises.
      </p>
      <form
        className={styles.form}
        onSubmit={onSubmit}
      >
        <label htmlFor='hb-tenant'>Tenant</label>
        <select
          id='hb-tenant'
          value={tenant}
          onChange={(e) => setTenant(e.target.value)}
        >
          <option value=''>no X-Tenant header</option>
          {tenants.map((t) => (
            <option
              key={t}
              value={t}
            >
              {t}
            </option>
          ))}
        </select>
        <label className={styles.check}>
          <input
            type='checkbox'
            checked={force}
            onChange={(e) => setForce(e.target.checked)}
          />{' '}
          Force
        </label>
        <label htmlFor='hb-line'>Heartbeat line</label>
        <input
          id='hb-line'
          type='text'
          value={line}
          placeholder='id|status|version|tag,tag'
          onChange={(e) => setLine(e.target.value)}
        />
        <RequireWrite>
          <button
            type='submit'
            disabled={sim.busy}
          >
            Apply
          </button>
        </RequireWrite>
      </form>
      <ResultPanel response={sim.last} />
      {sim.stats !== undefined && (
        <p className={styles.stats}>
          cached {sim.stats.cached} · hits {sim.stats.hits} · misses {sim.stats.misses}
        </p>
      )}
      <LineLog applied={sim.applied} />
    </main>
  )
}
