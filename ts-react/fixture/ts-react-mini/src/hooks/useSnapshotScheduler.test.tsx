import { renderHook } from '@testing-library/react'
import { type ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { CONFIG } from '../config/env'
import { ServicesProvider } from '../context/ServicesContext'
import { defaultServices } from '../test-utils/renderWithProviders'
import { useSnapshotScheduler } from './useSnapshotScheduler'

describe('useSnapshotScheduler', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('lists the fleet once per poll interval', async () => {
    const services = defaultServices()
    const list = vi.fn().mockResolvedValue([])
    const repo = { ...services.repo, list }
    function wrapper({ children }: Readonly<{ children: ReactNode }>) {
      return <ServicesProvider services={{ ...services, repo }}>{children}</ServicesProvider>
    }
    const { unmount } = renderHook(() => useSnapshotScheduler(), { wrapper })
    await vi.advanceTimersByTimeAsync(CONFIG.pollMs * 2)
    expect(list).toHaveBeenCalledTimes(2)
    unmount()
    await vi.advanceTimersByTimeAsync(CONFIG.pollMs)
    expect(list).toHaveBeenCalledTimes(2)
  })
})
