import { describe, expect, it } from 'vitest'

import { parseTenant } from './tenant'

describe('parseTenant', () => {
  it.each([['acme'], ['acme-42'], ['a'.repeat(32)]])('accepts %s', (raw) => {
    expect(parseTenant(raw)).toBe(raw)
  })

  it.each([[''], ['Acme'], ['a'.repeat(33)], ['ac me'], ['ac_me']])('rejects %j', (raw) => {
    expect(() => parseTenant(raw)).toThrow('tenant')
  })
})
