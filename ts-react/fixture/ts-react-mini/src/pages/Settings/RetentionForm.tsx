import { type FormEvent, useState } from 'react'

import { useServices } from '../../context/ServicesContext'
import { retentionDays } from '../../features/snapshot/config'
import { applyPolicy } from '../../features/snapshot/policy'
import styles from './RetentionForm.module.scss'

const RETENTION_KEY = 'retention'

/** How long snapshots are kept; the policy that prunes them reads the same setting. */
export function RetentionForm() {
  const { prefs } = useServices()
  const [value, setValue] = useState(prefs.get(RETENTION_KEY) ?? '')
  const [message, setMessage] = useState('')

  function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const raw = { retention: value }
    try {
      applyPolicy(new Date(), raw, [])
    } catch (err) {
      setMessage(err instanceof Error ? err.message : String(err))
      return
    }
    prefs.set(RETENTION_KEY, value)
    setMessage(`snapshots are kept for ${retentionDays(raw)} days`)
  }

  return (
    <form
      className={styles.form}
      onSubmit={save}
    >
      <h2>Retention</h2>
      <label htmlFor='retention'>Keep snapshots for</label>
      <input
        id='retention'
        value={value}
        placeholder='30d'
        onChange={(e) => setValue(e.target.value)}
      />
      <button type='submit'>Save</button>
      {message !== '' && <p role='status'>{message}</p>}
    </form>
  )
}
