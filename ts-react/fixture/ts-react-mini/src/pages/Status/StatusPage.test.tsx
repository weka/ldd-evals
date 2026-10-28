import '../../components/widgets'

import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '../../test-utils/renderWithProviders'
import { StatusPage } from './StatusPage'

describe('StatusPage', () => {
  it('shows the service line and counts what the console sees', async () => {
    renderWithProviders(<StatusPage />)
    expect(await screen.findByText(/service: devices=5 ready=2/)).toBeInTheDocument()
    expect(
      await screen.findByText(/console: devices=5 ready=2 degraded=1 down=1 other=1/)
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Fleet' })).toBeInTheDocument()
  })

  it('dry-runs a region sync', async () => {
    vi.spyOn(console, 'info').mockImplementation(() => undefined)
    renderWithProviders(<StatusPage />)
    await screen.findByText(/console: devices=5/)
    await userEvent.setup().click(screen.getByRole('button', { name: /Sync region/ }))
    expect(await screen.findByRole('status')).toHaveTextContent('synced 0 devices')
  })
})
