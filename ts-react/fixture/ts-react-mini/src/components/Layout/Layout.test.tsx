import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { renderWithProviders } from '../../test-utils/renderWithProviders'
import { Layout } from './Layout'

describe('Layout', () => {
  it('links to every page', () => {
    renderWithProviders(<Layout />)
    const nav = screen.getByRole('navigation', { name: 'Pages' })
    expect(nav).toHaveTextContent('Devices')
    expect(screen.getByRole('link', { name: 'Heartbeats' })).toHaveAttribute('href', '/heartbeats')
  })
})
