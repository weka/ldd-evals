import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { App } from './App'
import { renderWithProviders } from './test-utils/renderWithProviders'

describe('App', () => {
  it('opens on the device table', async () => {
    renderWithProviders(<App />, { route: '/' })
    expect(await screen.findByRole('heading', { name: 'Devices' })).toBeInTheDocument()
  })

  it('routes to the heartbeat simulator', () => {
    renderWithProviders(<App />, { route: '/heartbeats' })
    expect(screen.getByRole('heading', { name: 'Heartbeats' })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Heartbeat line' })).toBeInTheDocument()
  })
})
