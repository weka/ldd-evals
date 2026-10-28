import { renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { withQueryClient } from '../test-utils/withQueryClient'
import { useAlerts } from './useAlerts'

describe('useAlerts', () => {
  it('lists the alerts the service sent', async () => {
    const { result } = renderHook(() => useAlerts(), { wrapper: withQueryClient() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.[0]?.message).toBe('device d is down')
  })
})
