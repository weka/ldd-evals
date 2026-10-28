import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { renderWithProviders } from '../../../test-utils/renderWithProviders'
import { type Device } from '../../../types/device'
import { AlertsTab } from './AlertsTab'

const device: Device = {
  id: 'd',
  tenant: 'beta',
  status: 'DOWN',
  version: '2.0',
  tags: [],
  lastSeen: new Date(0)
}

describe('AlertsTab', () => {
  it('lists the alerts that mention the device', async () => {
    renderWithProviders(<AlertsTab device={device} />)
    expect(await screen.findByRole('listitem')).toHaveTextContent('pagerduty: device d is down')
  })

  it('raises the alert the status earns', async () => {
    renderWithProviders(<AlertsTab device={device} />)
    await userEvent.setup().click(screen.getByRole('button', { name: 'Raise again' }))
    expect(await screen.findByRole('status')).toHaveTextContent('raised')
  })
})
