import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { renderWithProviders } from '../../test-utils/renderWithProviders'
import { ChannelsForm } from './ChannelsForm'

describe('ChannelsForm', () => {
  it('sends a slack test alert to a channel recipient', async () => {
    renderWithProviders(<ChannelsForm />)
    await userEvent.setup().click(screen.getByRole('button', { name: 'Send test alert' }))
    expect(await screen.findByRole('status')).toHaveTextContent('sent on slack')
  })

  it('refuses a recipient that does not fit the channel', async () => {
    renderWithProviders(<ChannelsForm />)
    const user = userEvent.setup()
    await user.selectOptions(screen.getByRole('combobox', { name: 'Channel' }), 'email')
    await user.click(screen.getByRole('button', { name: 'Send test alert' }))
    expect(await screen.findByRole('status')).toHaveTextContent('bad recipient "#fleet"')
  })
})
