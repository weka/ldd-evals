import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { renderWithProviders } from '../../test-utils/renderWithProviders'
import { DeviceSearch } from './DeviceSearch'

describe('DeviceSearch', () => {
  it('lists matching devices as links', async () => {
    renderWithProviders(<DeviceSearch />)
    await userEvent.setup().type(screen.getByRole('searchbox', { name: 'Find device' }), 'd')
    expect(await screen.findByRole('link', { name: 'beta/d' })).toHaveAttribute(
      'href',
      '/devices/beta/d'
    )
  })
})
