import { describe, expect, it } from 'vitest'

import { parseDeviceId } from './deviceId'

describe('parseDeviceId', () => {
  it('trims a valid id', () => {
    expect(parseDeviceId('  dev-42 ')).toBe('dev-42')
  })

  it('rejects an empty id', () => {
    expect(() => parseDeviceId('   ')).toThrow('empty')
  })

  it('rejects an over-long id', () => {
    expect(() => parseDeviceId('x'.repeat(65))).toThrow('at most')
  })
})
