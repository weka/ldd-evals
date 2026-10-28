import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { type Device } from '../../types/device'
import { PlacementDialog } from './PlacementDialog'

const device: Device = {
  id: 'd',
  tenant: 'beta',
  status: 'READY',
  version: '1',
  tags: ['region:eu'],
  lastSeen: new Date()
}

const nodes = [
  { id: 'n1', zone: 'eu', capacity: 5 },
  { id: 'n2', zone: 'us', capacity: 3 }
]

describe('PlacementDialog', () => {
  it('places the primary in the device zone and the secondary elsewhere', () => {
    render(
      <PlacementDialog
        device={device}
        nodes={nodes}
        onClose={() => undefined}
      />
    )
    expect(screen.getByText(/primary/)).toHaveTextContent('primary n1, secondary n2')
  })

  it('reports a zone without nodes', async () => {
    render(
      <PlacementDialog
        device={device}
        nodes={nodes}
        onClose={() => undefined}
      />
    )
    const zone = screen.getByRole('textbox', { name: 'Zone' })
    await userEvent.setup().clear(zone)
    await userEvent.setup().type(zone, 'sa')
    expect(screen.getByRole('alert')).toHaveTextContent('no placement for zone "sa"')
  })
})
