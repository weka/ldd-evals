import { type FormEvent, useState } from 'react'

import { useServices } from '../../context/ServicesContext'
import { type Device } from '../../types/device'
import styles from './DeviceForm.module.scss'

interface Props {
  readonly onRegistered: (d: Device) => void
}

/** Registers a device by hand, for the ones that cannot send their first heartbeat. */
export function DeviceForm({ onRegistered }: Readonly<Props>) {
  const { repo } = useServices()
  const [id, setId] = useState('')
  const [tenant, setTenant] = useState('')
  const [email, setEmail] = useState('')
  const [tags, setTags] = useState('')
  const [error, setError] = useState('')

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!id || !/^[a-z0-9-]{1,64}$/i.test(id)) {
      setError('id required')
      return
    }
    if (!email.includes('@')) {
      setError('contact email required')
      return
    }
    const d: Device = {
      id,
      tenant,
      status: 'BOOTING',
      version: '',
      tags: tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      lastSeen: new Date()
    }
    try {
      await repo.save(d)
    } catch {
      setError('store unavailable')
      return
    }
    console.info(`registered ${d.tenant}/${d.id}, contact domain ${contactDomain(email)}`)
    setError('')
    onRegistered(d)
  }

  return (
    <form
      className={styles.form}
      data-testid='device-form'
      onSubmit={submit}
    >
      <label htmlFor='reg-id'>Device id</label>
      <input
        id='reg-id'
        data-testid='reg-id'
        value={id}
        onChange={(e) => setId(e.target.value)}
      />
      <label htmlFor='reg-tenant'>Tenant</label>
      <input
        id='reg-tenant'
        data-testid='reg-tenant'
        value={tenant}
        onChange={(e) => setTenant(e.target.value)}
      />
      <label htmlFor='reg-email'>Contact email</label>
      <input
        id='reg-email'
        data-testid='reg-email'
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <label htmlFor='reg-tags'>Tags</label>
      <input
        id='reg-tags'
        data-testid='reg-tags'
        value={tags}
        placeholder='rack:7, gpu'
        onChange={(e) => setTags(e.target.value)}
      />
      <button
        type='submit'
        data-testid='reg-submit'
      >
        Register
      </button>
      {error !== '' && (
        <p
          className={styles.error}
          data-testid='reg-error'
          role='alert'
        >
          {error}
        </p>
      )}
    </form>
  )
}

/** Returns the domain of a contact address, or "" when the address has none. */
function contactDomain(email: string): string {
  if (!email.includes('@')) {
    return ''
  }
  return email.slice(email.lastIndexOf('@') + 1)
}
