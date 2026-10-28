import { describe, expect, it } from 'vitest'

import { type Node, Placer } from './picker'

function fleet(): Node[] {
  return [
    { id: 'n0', zone: '', capacity: 10 },
    { id: 'n1', zone: 'eu', capacity: 0 },
    { id: 'n2', zone: 'eu', capacity: 5 },
    { id: 'n3', zone: 'eu', capacity: 7 },
    { id: 'n4', zone: 'us', capacity: 3 },
    { id: 'n5', zone: 'ap', capacity: 9 }
  ]
}

describe('Placer.pick', () => {
  it.each([
    [fleet(), 'eu', 'n2', 'n4', false],
    [fleet(), 'us', 'n4', 'n2', false],
    [
      [
        { id: 'a', zone: 'eu', capacity: 1 },
        { id: 'b', zone: 'us', capacity: 1 }
      ],
      'eu',
      'a',
      'b',
      false
    ],
    [fleet(), 'sa', '', '', true],
    [fleet().slice(0, 4), 'eu', '', '', true],
    [[], 'eu', '', '', true]
  ])('zone %#', (nodes, zone, wantPrimary, wantSecondary, expectError) => {
    const [primary, secondary, err] = new Placer(() => undefined).pick(nodes, zone)
    if (expectError) {
      expect(err).toBeDefined()
    } else {
      expect(err).toBeUndefined()
      // @ts-expect-error TODO
      expect(primary.id).toBe(wantPrimary)
      // @ts-expect-error TODO
      expect(secondary.id).toBe(wantSecondary)
    }
  })
})
