import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { server } from '../../test-utils/mocks/server'
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

  it('checks that the webhook accepts a POST', async () => {
    server.use(
      http.get('/webhook.conf', () => HttpResponse.text('https://hooks.test/alerts')),
      http.post('https://hooks.test/alerts', () => new HttpResponse(null, { status: 204 }))
    )
    renderWithProviders(<ChannelsForm />)
    await userEvent.setup().click(screen.getByRole('button', { name: 'Check webhook' }))
    expect(await screen.findByRole('status')).toHaveTextContent('webhook answered 204')
  })
})
