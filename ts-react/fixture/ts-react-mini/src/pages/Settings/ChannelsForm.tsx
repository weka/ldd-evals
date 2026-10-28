import { type FormEvent, useState } from 'react'

import { deliver, validateAlert } from '../../services/validate'
import { type Alert } from '../../types/alert'
import { CHANNEL_EMAIL, CHANNEL_PAGERDUTY, CHANNEL_SLACK } from '../../types/channel'
import styles from './ChannelsForm.module.scss'

const CHANNELS = [CHANNEL_EMAIL, CHANNEL_SLACK, CHANNEL_PAGERDUTY]

/** Sends a test alert on a channel, so the recipient can be checked before an outage needs it. */
export function ChannelsForm() {
  const [channel, setChannel] = useState<string>(CHANNEL_SLACK)
  const [recipient, setRecipient] = useState('#fleet')
  const [outcome, setOutcome] = useState('')

  async function send(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const alert: Alert = { channel, recipient, summary: 'test alert from the fleet dashboard' }
    try {
      validateAlert(alert)
      await deliver(alert)
      setOutcome(`sent on ${channel}`)
    } catch (err) {
      setOutcome(err instanceof Error ? err.message : String(err))
    }
  }

  return (
    <form
      className={styles.form}
      onSubmit={send}
    >
      <h2>Channels</h2>
      <label htmlFor='channel'>Channel</label>
      <select
        id='channel'
        value={channel}
        onChange={(e) => setChannel(e.target.value)}
      >
        {CHANNELS.map((c) => (
          <option
            key={c}
            value={c}
          >
            {c}
          </option>
        ))}
      </select>
      <label htmlFor='recipient'>Recipient</label>
      <input
        id='recipient'
        value={recipient}
        onChange={(e) => setRecipient(e.target.value)}
      />
      <button type='submit'>Send test alert</button>
      {outcome !== '' && <p role='status'>{outcome}</p>}
    </form>
  )
}
