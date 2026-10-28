import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { ResultPanel } from './ResultPanel'

describe('ResultPanel', () => {
  it('shows the body verbatim and the status code', () => {
    render(<ResultPanel response={{ status: 400, body: '{"error":"bad id"}' }} />)
    expect(screen.getByRole('status', { name: 'Result' })).toHaveTextContent('{"error":"bad id"}')
    expect(screen.getByRole('status', { name: 'Status code' })).toHaveTextContent('400')
  })

  it('renders empty before the first line', () => {
    render(<ResultPanel response={undefined} />)
    expect(screen.getByRole('status', { name: 'Result' })).toHaveTextContent('')
  })
})
