import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { renderWithProviders } from '../../test-utils/renderWithProviders'
import { RequireWrite } from './RequireWrite'

describe('RequireWrite', () => {
  it('renders the control for a writable console', () => {
    renderWithProviders(
      <RequireWrite>
        <button type='button'>Register</button>
      </RequireWrite>
    )
    expect(screen.getByRole('button', { name: 'Register' })).toBeInTheDocument()
  })

  it('replaces the control with the reason for a read-only console', () => {
    renderWithProviders(
      <RequireWrite>
        <button type='button'>Register</button>
      </RequireWrite>,
      { readOnly: true }
    )
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(screen.getByText('write permission required')).toBeInTheDocument()
  })
})
