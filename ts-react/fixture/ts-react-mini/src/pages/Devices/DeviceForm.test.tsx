import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '../../test-utils/renderWithProviders'
import { DeviceForm } from './DeviceForm'

describe('DeviceForm', () => {
  it('registers a booting device', async () => {
    const onRegistered = vi.fn()
    renderWithProviders(<DeviceForm onRegistered={onRegistered} />)
    const user = userEvent.setup()
    await user.type(screen.getByTestId('reg-id'), 'dev-1')
    await user.type(screen.getByTestId('reg-tenant'), 't1')
    await user.type(screen.getByTestId('reg-email'), 'ops@example.com')
    await user.type(screen.getByTestId('reg-tags'), 'rack:7')
    await user.click(screen.getByTestId('reg-submit'))
    await waitFor(() => expect(onRegistered).toHaveBeenCalledTimes(1))
    expect(onRegistered.mock.calls[0]?.[0]).toMatchObject({
      id: 'dev-1',
      status: 'BOOTING',
      tags: ['rack:7']
    })
  })

  it('rejects a missing id', async () => {
    renderWithProviders(<DeviceForm onRegistered={() => undefined} />)
    await userEvent.setup().click(screen.getByTestId('reg-submit'))
    expect(screen.getByTestId('reg-error')).toHaveTextContent('id required')
  })

  it('rejects a missing contact', async () => {
    renderWithProviders(<DeviceForm onRegistered={() => undefined} />)
    const user = userEvent.setup()
    await user.type(screen.getByTestId('reg-id'), 'dev-1')
    await user.type(screen.getByTestId('reg-email'), 'ops')
    await user.click(screen.getByTestId('reg-submit'))
    expect(screen.getByTestId('reg-error')).toHaveTextContent('contact email required')
  })
})
