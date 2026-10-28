import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { renderWithProviders } from '../../test-utils/renderWithProviders'
import { EndpointForm } from './EndpointForm'

describe('EndpointForm', () => {
  it('builds the API base from host, port and TLS', async () => {
    renderWithProviders(<EndpointForm />)
    const user = userEvent.setup()
    await user.clear(screen.getByRole('textbox', { name: 'Host' }))
    await user.type(screen.getByRole('textbox', { name: 'Host' }), 'fleet.internal')
    await user.click(screen.getByRole('checkbox', { name: 'TLS' }))
    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(screen.getByRole('status')).toHaveTextContent('API base https://fleet.internal:8080')
  })
})
