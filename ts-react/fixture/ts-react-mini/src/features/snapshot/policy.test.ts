import { describe, expect, it } from 'vitest'

import { applyPolicy } from './policy'
import { newSnapshot } from './snapshot'

const now = new Date('2024-03-01T12:00:00Z')
const DAY = 86_400_000

describe('applyPolicy', () => {
  it('expires what is older than the retention', () => {
    const old = newSnapshot('dev-1', new Date(now.getTime() - 40 * DAY))
    const fresh = newSnapshot('dev-1', new Date(now.getTime() - 2 * DAY))
    expect(applyPolicy(now, { retention: '30d' }, [old, fresh])).toEqual([old])
  })

  it('rejects a missing or out-of-range retention', () => {
    expect(() => applyPolicy(now, {}, [])).toThrow('retention missing')
    expect(() => applyPolicy(now, { retention: '0d' }, [])).toThrow('out of range')
  })
})
