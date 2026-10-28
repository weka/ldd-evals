import { type FormEvent, useState } from 'react'

import { RequireWrite } from '../../../components/RequireWrite/RequireWrite'
import { apiClient } from '../../../services/apiClient'
import { type Device } from '../../../types/device'
import styles from './HeartbeatsTab.module.scss'

interface Props {
  readonly device: Device
}

/** Sends one heartbeat line to the service on the device's behalf. */
export function HeartbeatsTab({ device }: Readonly<Props>) {
  const [line, setLine] = useState(`${device.id}|${device.status}|${device.version}`)
  const [outcome, setOutcome] = useState('')

  async function send(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    try {
      await apiClient.post('/heartbeat', line, (raw) => raw, {
        headers: { [apiClient.tenantHeaderName()]: device.tenant }
      })
      setOutcome('accepted')
    } catch (err) {
      setOutcome(`rejected: ${String(err)}`)
    }
  }

  return (
    <section>
      <h2>Send a heartbeat</h2>
      <form
        className={styles.form}
        onSubmit={send}
      >
        <label htmlFor='tab-line'>Line</label>
        <input
          id='tab-line'
          value={line}
          onChange={(e) => setLine(e.target.value)}
        />
        <RequireWrite>
          <button type='submit'>Send</button>
        </RequireWrite>
      </form>
      {outcome !== '' && <p role='status'>{outcome}</p>}
    </section>
  )
}
