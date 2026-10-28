import { describe, expect, it } from 'vitest'

import { daysBetween, formatStamp, seconds } from './time'

describe('time', () => {
  it('daysBetween counts whole days either way round', () => {
    const start = new Date('2024-01-01T00:00:00Z')
    const end = new Date(start.getTime() + 72 * 3_600_000)
    expect(daysBetween(start, end)).toBe(3)
    expect(daysBetween(end, start)).toBe(3)
  })

  it('formatStamp drops the milliseconds', () => {
    expect(formatStamp(new Date('2024-01-02T03:04:05.678Z'))).toBe('2024-01-02T03:04:05Z')
  })

  it('seconds floors', () => {
    expect(seconds(1999)).toBe('1s')
  })
})
