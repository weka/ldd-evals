import { describe, expect, it } from 'vitest'

import { contains, slugify, truncate } from './strings'

describe('strings', () => {
  it('truncate', () => {
    expect(truncate('heartbeat', 5)).toBe('heart')
    expect(truncate('hb', 5)).toBe('hb')
  })

  it('slugify', () => {
    expect(slugify('Device  #12 / EU')).toBe('device-12-eu')
  })

  it('contains', () => {
    const tags = ['gpu', 'region:eu']
    expect(contains(tags, 'gpu')).toBe(true)
    expect(contains(tags, 'cpu')).toBe(false)
  })
})
