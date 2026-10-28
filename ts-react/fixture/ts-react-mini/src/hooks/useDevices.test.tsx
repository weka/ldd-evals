import { renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { withQueryClient } from '../test-utils/withQueryClient'
import { useDevices } from './useDevices'

describe('useDevices', () => {
  it('lists the fleet healthiest first', async () => {
    const { result } = renderHook(() => useDevices(), { wrapper: withQueryClient() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.map((d) => d.id)).toEqual(['a', 'b', 'c', 'e', 'd'])
  })
})
