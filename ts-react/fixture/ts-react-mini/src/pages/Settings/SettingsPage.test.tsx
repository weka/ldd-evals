import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { renderWithProviders } from '../../test-utils/renderWithProviders'
import { SettingsPage } from './SettingsPage'

describe('SettingsPage', () => {
  it('shows every section', () => {
    renderWithProviders(<SettingsPage />)
    for (const name of ['Retention', 'Channels', 'Endpoint', 'Export']) {
      expect(screen.getByRole('heading', { name })).toBeInTheDocument()
    }
  })
})
