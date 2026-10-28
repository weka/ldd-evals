import { act, renderHook } from '@testing-library/react'
import { type ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { useTableFilters } from './useTableFilters'

function at(route: string) {
  return function Wrapper({ children }: Readonly<{ children: ReactNode }>) {
    return <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
  }
}

describe('useTableFilters', () => {
  it('reads the filters from the URL', () => {
    const { result } = renderHook(() => useTableFilters(), { wrapper: at('/devices?tenant=acme') })
    expect(result.current.tenant).toBe('acme')
    expect(result.current.status).toBe('')
  })

  it('writes a filter back and clears it on empty', () => {
    const { result } = renderHook(() => useTableFilters(), { wrapper: at('/devices') })
    act(() => {
      result.current.setStatus('DOWN')
    })
    expect(result.current.status).toBe('DOWN')
    act(() => {
      result.current.setStatus('')
    })
    expect(result.current.status).toBe('')
  })
})
