import { type UseQueryResult } from '@tanstack/react-query'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '../../test-utils/renderWithProviders'
import { type Device } from '../../types/device'
import { DevicesPage } from './DevicesPage'

vi.mock('../../hooks/useDevices', () => ({
  useDevices: () => {
    const data: Device[] = [
      { id: 'a', tenant: 'acme', status: 'READY', version: '1.0', tags: [], lastSeen: new Date(0) },
      {
        id: 'd',
        tenant: 'beta',
        status: 'DOWN',
        version: '2.0',
        tags: ['region:eu'],
        lastSeen: new Date(0)
      }
    ]
    // @ts-expect-error TODO
    const result: UseQueryResult<Device[]> = {
      data,
      isPending: false,
      isError: false,
      isSuccess: true,
      refetch: vi.fn()
    }
    return result
  }
}))

describe('DevicesPage', () => {
  it('lists the fleet', () => {
    renderWithProviders(<DevicesPage />, { route: '/devices' })
    expect(screen.getByRole('link', { name: 'a' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'd' })).toBeInTheDocument()
  })

  it('filters by tenant through the URL', () => {
    renderWithProviders(<DevicesPage />, { route: '/devices?tenant=beta' })
    expect(screen.queryByRole('link', { name: 'a' })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'd' })).toBeInTheDocument()
  })

  it('opens the placement dialog for a row', async () => {
    renderWithProviders(<DevicesPage />, { route: '/devices' })
    await userEvent.setup().click(screen.getAllByRole('button', { name: 'Place replicas' })[1]!)
    expect(screen.getByRole('heading', { name: 'Place replicas for d' })).toBeInTheDocument()
    expect(screen.getByText(/primary/)).toHaveTextContent('primary eu-a, secondary us-a')
  })
})
