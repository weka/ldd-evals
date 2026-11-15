import { describe, expect, it } from 'vitest'

import { matchTags } from './tagFilter'

const TAGS = ['region:eu', 'Tier=gold', 'retired']

describe('matchTags', () => {
  it.each([
    ['region:eu', true],
    ['region:us', false],
    ['region', true],
    ['tier:gold', true],
    ['!retired', false],
    ['!zone', true],
    ['region:eu, !retired', false],
    ['region:eu,tier:silver', false],
    [' region : eu ', true]
  ])('matches %s', (expr, want) => {
    expect(matchTags(TAGS, expr)).toBe(want)
  })

  it.each(['', 'region:eu,', '!', ':eu', 'region:eu:x', 'region:eu,region:us', 'region,!region'])(
    'refuses the filter %s',
    (expr) => {
      expect(() => matchTags([], expr)).toThrow('tag filter')
    }
  )
})
