import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { App } from '../../App'
import { renderWithProviders } from '../../test-utils/renderWithProviders'

describe('DeviceView', () => {
  it('shows the overview and switches tabs through the URL', async () => {
    renderWithProviders(<App />, { route: '/devices/acme/c' })
    expect(await screen.findByRole('heading', { name: 'acme/c' })).toBeInTheDocument()
    expect(screen.getByText('lab 1')).toBeInTheDocument()
    await userEvent.setup().click(screen.getByRole('tab', { name: 'snapshots' }))
    expect(await screen.findByText('no snapshots yet')).toBeInTheDocument()
  })

  it('tells an unknown device apart from an outage', async () => {
    renderWithProviders(<App />, { route: '/devices/acme/ghost' })
    expect(await screen.findByRole('alert')).toHaveTextContent('no device acme/ghost')
  })
})
