import { renderHook, waitFor } from '@testing-library/react'
import { type ReactNode } from 'react'
import { describe, expect, it } from 'vitest'

import { ServicesProvider } from '../context/ServicesContext'
import { defaultServices } from '../test-utils/renderWithProviders'
import { useDeviceSearch } from './useDeviceSearch'

function wrapper({ children }: Readonly<{ children: ReactNode }>) {
  return <ServicesProvider services={defaultServices()}>{children}</ServicesProvider>
}

describe('useDeviceSearch', () => {
  it('finds devices by id substring', async () => {
    const { result } = renderHook(() => useDeviceSearch('a'), { wrapper })
    await waitFor(() => expect(result.current.map((d) => d.id)).toEqual(['a']))
  })

  it('returns nothing for an empty query', () => {
    const { result } = renderHook(() => useDeviceSearch(''), { wrapper })
    expect(result.current).toEqual([])
  })
})
