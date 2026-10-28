import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { StatusBadge } from './StatusBadge'

describe('StatusBadge', () => {
  it.each([
    ['READY', 'ready'],
    ['DEGRADED', 'degraded'],
    ['DOWN', 'down'],
    ['BOOTING', 'booting']
  ])('renders %s', (status, text) => {
    render(<StatusBadge status={status} />)
    expect(screen.getByText(text)).toBeInTheDocument()
  })

  it('renders nothing for a status it does not know', () => {
    const { container } = render(<StatusBadge status='SLEEPY' />)
    expect(container).toBeEmptyDOMElement()
  })
})
