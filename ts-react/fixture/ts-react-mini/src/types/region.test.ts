import { describe, expect, it } from 'vitest'

import { parseRegion, zoneOf } from './region'

describe('parseRegion', () => {
  it.each([
    ['eu', 'eu'],
    ['us', 'us'],
    ['ap', 'ap']
  ])('success: %s', (raw, want) => {
    expect(parseRegion(raw)).toBe(want)
  })

  it.each([[''], ['EU'], ['mars']])('error: %j', (raw) => {
    expect(() => parseRegion(raw)).toThrow('region')
  })
})

describe('zoneOf', () => {
  it.each([
    ['eu', 'eu-central-1'],
    ['us', 'us-east-1'],
    ['ap', 'ap-southeast-1']
  ] as const)('%s', (region, want) => {
    expect(zoneOf(region)).toBe(want)
  })
})
