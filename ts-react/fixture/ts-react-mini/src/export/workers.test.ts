import { describe, expect, it, vi } from 'vitest'

import { CONFIG } from '../config/env'
import { type Job, start } from './workers'

describe('start', () => {
  it('runs every job across the configured workers', async () => {
    vi.spyOn(console, 'info').mockImplementation(() => undefined)
    CONFIG.numWorkers = 2
    const done: string[] = []
    const jobs: Job[] = ['job-a', 'job-b', 'job-c'].map((id) => ({
      id,
      run: () => {
        done.push(id)
        return Promise.resolve()
      }
    }))

    const started = await start(jobs)

    expect(started).toBe(2)
    expect([...done].sort((a, b) => a.localeCompare(b))).toEqual(['job-a', 'job-b', 'job-c'])
  })
})
