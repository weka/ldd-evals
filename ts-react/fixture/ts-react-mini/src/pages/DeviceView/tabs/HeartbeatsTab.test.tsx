import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { renderWithProviders } from '../../../test-utils/renderWithProviders'
import { type Device } from '../../../types/device'
import { HeartbeatsTab } from './HeartbeatsTab'

const device: Device = {
  id: 'a',
  tenant: 'acme',
  status: 'READY',
  version: '1.0',
  tags: [],
  lastSeen: new Date(0)
}

describe('HeartbeatsTab', () => {
  it('prefills the line and reports acceptance', async () => {
    renderWithProviders(<HeartbeatsTab device={device} />)
    expect(screen.getByRole('textbox', { name: 'Line' })).toHaveValue('a|READY|1.0')
    await userEvent.setup().click(screen.getByRole('button', { name: 'Send' }))
    expect(await screen.findByRole('status')).toHaveTextContent('accepted')
  })
})
