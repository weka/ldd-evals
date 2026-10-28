import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { renderWithProviders } from '../../test-utils/renderWithProviders'
import { HeartbeatsPage } from './HeartbeatsPage'

async function apply(line: string) {
  const user = userEvent.setup()
  const input = screen.getByRole('textbox', { name: 'Heartbeat line' })
  await user.clear(input)
  if (line) {
    await user.type(input, line)
  }
  await user.click(screen.getByRole('button', { name: 'Apply' }))
  await waitFor(() => expect(screen.getByRole('button', { name: 'Apply' })).toBeEnabled())
  return screen.getByRole('status', { name: 'Result' }).textContent
}

describe('HeartbeatsPage', () => {
  it('rejects an over-long id', async () => {
    renderWithProviders(<HeartbeatsPage />)
    const user = userEvent.setup()
    await user.selectOptions(screen.getByRole('combobox', { name: 'Tenant' }), 'acme')
    expect(await apply('x'.repeat(65) + '|ready|1.0')).toBe('{"error":"bad id"}')
    expect(screen.getByRole('status', { name: 'Status code' })).toHaveTextContent('400')
  })

  it('rejects a line with missing fields', async () => {
    renderWithProviders(<HeartbeatsPage />)
    expect(await apply('dev-1|ready')).toBe('{"error":"bad heartbeat"}')
  })

  it('rejects an unknown status', async () => {
    renderWithProviders(<HeartbeatsPage />)
    expect(await apply('dev-1|SLEEPY|1.0')).toContain('unknown status')
  })

  it('creates an unknown device and scores its tags', async () => {
    renderWithProviders(<HeartbeatsPage />)
    expect(await apply('dev-1|ready|1.2.3|gpu, region:eu ,gpu,region:mars')).toBe(
      '{"id":"dev-1","score":120,"changed":true,"tags":["gpu","region:eu"]}'
    )
    expect(screen.getByRole('heading', { name: 'Applied 1 lines' })).toBeInTheDocument()
  })

  it('keeps the status when the same line arrives again', async () => {
    renderWithProviders(<HeartbeatsPage />)
    await apply('dev-1|ready|1.0')
    // let the first heartbeat settle before the same line arrives again
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(await apply('dev-1|ready|1.0')).toBe(
      '{"id":"dev-1","score":100,"changed":false,"tags":[]}'
    )
  })

  it('hides the Apply button for a read-only console', () => {
    renderWithProviders(<HeartbeatsPage />, { readOnly: true })
    expect(screen.queryByRole('button', { name: 'Apply' })).not.toBeInTheDocument()
    expect(screen.getByText('write permission required')).toBeInTheDocument()
  })
})
