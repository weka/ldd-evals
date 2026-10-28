import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { type Device } from '../../types/device'
import { UptimeWidget } from './UptimeWidget'

function device(id: string, lastSeen: string): Device {
  return {
    id,
    tenant: 'acme',
    status: 'READY',
    version: '',
    tags: [],
    lastSeen: new Date(lastSeen)
  }
}

describe('UptimeWidget', () => {
  it('names the quietest device', () => {
    render(
      <UptimeWidget
        devices={[device('a', '2024-03-01T12:00:00Z'), device('b', '2024-03-01T01:00:00Z')]}
      />
    )
    expect(screen.getByText('acme/b at 2024-03-01T01:00:00Z')).toBeInTheDocument()
  })

  it('says so when there are no devices', () => {
    render(<UptimeWidget devices={[]} />)
    expect(screen.getByText('no devices')).toBeInTheDocument()
  })
})
