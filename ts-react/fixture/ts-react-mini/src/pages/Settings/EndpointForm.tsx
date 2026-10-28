import { type FormEvent, useState } from 'react'

import { useServices } from '../../context/ServicesContext'
import { Client } from '../../services/transport/client'
import styles from './EndpointForm.module.scss'

const ENDPOINT_KEY = 'endpoint'
const DEFAULT_HOST = 'localhost'
const DEFAULT_PORT = '8080'

/** Where the sibling fleet service is reached: host, port and whether to use TLS. */
export function EndpointForm() {
  const { prefs } = useServices()
  const [host, setHost] = useState(DEFAULT_HOST)
  const [port, setPort] = useState(DEFAULT_PORT)
  const [tls, setTls] = useState(false)
  const [base, setBase] = useState(prefs.get(ENDPOINT_KEY) ?? '')

  function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const client = new Client(host, Number(port), tls)
    prefs.set(ENDPOINT_KEY, client.baseUrl())
    setBase(client.baseUrl())
  }

  return (
    <form
      className={styles.form}
      onSubmit={save}
    >
      <h2>Endpoint</h2>
      <label htmlFor='ep-host'>Host</label>
      <input
        id='ep-host'
        value={host}
        onChange={(e) => setHost(e.target.value)}
      />
      <label htmlFor='ep-port'>Port</label>
      <input
        id='ep-port'
        type='number'
        value={port}
        onChange={(e) => setPort(e.target.value)}
      />
      <label>
        <input
          type='checkbox'
          checked={tls}
          onChange={(e) => setTls(e.target.checked)}
        />{' '}
        TLS
      </label>
      <button type='submit'>Save</button>
      {base !== '' && (
        <p role='status'>
          API base <code>{base}</code>
        </p>
      )}
    </form>
  )
}
