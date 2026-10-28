import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { renderWithProviders } from '../../test-utils/renderWithProviders'
import { RetentionForm } from './RetentionForm'

describe('RetentionForm', () => {
  it('saves a retention inside the range', async () => {
    renderWithProviders(<RetentionForm />)
    const user = userEvent.setup()
    await user.type(screen.getByRole('textbox', { name: 'Keep snapshots for' }), '30d')
    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(screen.getByRole('status')).toHaveTextContent('kept for 30 days')
  })

  it('refuses a retention outside the range', async () => {
    renderWithProviders(<RetentionForm />)
    const user = userEvent.setup()
    await user.type(screen.getByRole('textbox', { name: 'Keep snapshots for' }), '400d')
    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(screen.getByRole('status')).toHaveTextContent('out of range')
  })
})
