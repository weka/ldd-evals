import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '../../test-utils/renderWithProviders'
import { ExportPanel } from './ExportPanel'

describe('ExportPanel', () => {
  it('summarizes the fleet by firmware', async () => {
    renderWithProviders(<ExportPanel />)
    const user = userEvent.setup()
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Summarize by firmware' })).toBeEnabled()
    )
    await screen.findByRole('button', { name: 'Export all' })
    await new Promise((resolve) => setTimeout(resolve, 20))
    await user.click(screen.getByRole('button', { name: 'Summarize by firmware' }))
    expect(screen.getByText(/1\.0: 2/)).toBeInTheDocument()
  })

  it('exports every device', async () => {
    vi.spyOn(console, 'info').mockImplementation(() => undefined)
    renderWithProviders(<ExportPanel />)
    await new Promise((resolve) => setTimeout(resolve, 20))
    await userEvent.setup().click(screen.getByRole('button', { name: 'Export all' }))
    expect(await screen.findByRole('status')).toHaveTextContent('exported 5 devices')
  })
})
