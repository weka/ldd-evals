import { renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { withQueryClient } from '../test-utils/withQueryClient'
import { useSnapshots } from './useSnapshots'

describe('useSnapshots', () => {
  it('lists a device’s snapshots oldest first', async () => {
    const { result } = renderHook(() => useSnapshots('a'), { wrapper: withQueryClient() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.map((s) => s.id)).toEqual(['a-1709250000', 'a-1709290000'])
  })
})
