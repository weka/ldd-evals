import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { renderWithProviders } from '../../test-utils/renderWithProviders'
import { type Device } from '../../types/device'
import { DeviceTabs } from './DeviceTabs'

const device: Device = {
  id: 'a',
  tenant: 'acme',
  status: 'READY',
  version: '1.0',
  tags: [],
  lastSeen: new Date(0)
}

describe('DeviceTabs', () => {
  it('renders the heartbeats tab', () => {
    renderWithProviders(
      <DeviceTabs
        tab='heartbeats'
        device={device}
        cluster={null}
        tenantId='acme'
        clusterId=''
      />
    )
    expect(screen.getByRole('heading', { name: 'Send a heartbeat' })).toBeInTheDocument()
  })
})
