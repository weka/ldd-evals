import { renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { withQueryClient } from '../test-utils/withQueryClient'
import { useDeviceFeed } from './useDeviceFeed'

describe('useDeviceFeed', () => {
  it('reports nothing quiet until a tick has passed', async () => {
    const { result } = renderHook(() => useDeviceFeed(50), { wrapper: withQueryClient() })
    expect(result.current).toEqual([])
    await waitFor(() => expect(result.current).toEqual([]))
  })
})
