import { describe, expect, it } from 'vitest'

import { retentionDays } from './config'

describe('retentionDays', () => {
  it('reads a day count with or without the suffix', () => {
    expect(retentionDays({ retention: '30d' })).toBe(30)
    expect(retentionDays({ retention: '7' })).toBe(7)
  })

  it('is zero when unset or out of range', () => {
    expect(retentionDays({})).toBe(0)
    expect(retentionDays({ retention: '400d' })).toBe(0)
    expect(retentionDays({ retention: 'soon' })).toBe(0)
  })
})
