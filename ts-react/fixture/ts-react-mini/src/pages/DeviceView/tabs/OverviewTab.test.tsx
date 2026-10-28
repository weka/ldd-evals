import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { renderWithProviders } from '../../../test-utils/renderWithProviders'
import { type Device } from '../../../types/device'
import { OverviewTab } from './OverviewTab'

const device: Device = {
  id: 'c',
  tenant: 'acme',
  status: 'DEGRADED',
  version: '0.9',
  tags: ['cluster:lab-1'],
  lastSeen: new Date('2024-03-01T12:00:00Z')
}

describe('OverviewTab', () => {
  it('shows the record and the cluster', () => {
    renderWithProviders(
      <OverviewTab
        device={device}
        cluster={{ id: 'lab-1', name: 'lab 1' }}
        tenantId='acme'
        clusterId='lab-1'
      />
    )
    expect(screen.getByText('degraded')).toBeInTheDocument()
    expect(screen.getByText('lab 1')).toBeInTheDocument()
    expect(screen.getByText(/last seen 2024-03-01T12:00:00Z/)).toBeInTheDocument()
  })

  it('says when the device is not enrolled', () => {
    renderWithProviders(
      <OverviewTab
        device={device}
        cluster={null}
        tenantId='acme'
        clusterId=''
      />
    )
    expect(screen.getByText('not enrolled')).toBeInTheDocument()
  })
})
