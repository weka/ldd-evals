import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { type Device } from '../../types/device'
import { FleetWidget } from './FleetWidget'

function device(id: string, status: string): Device {
  return { id, tenant: 'acme', status, version: '', tags: [], lastSeen: new Date() }
}

describe('FleetWidget', () => {
  it('counts online devices', () => {
    render(
      <FleetWidget devices={[device('a', 'READY'), device('b', 'DOWN'), device('c', 'DEGRADED')]} />
    )
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText(/of 3 online/)).toBeInTheDocument()
  })
})
