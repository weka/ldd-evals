import { describe, expect, it } from 'vitest'

import { readTags } from './tagText'

describe('readTags', () => {
  it.each([
    [['region:eu'], [['region', ['eu']]]],
    [['Tier=gold'], [['tier', ['gold']]]],
    [['retired'], [['retired', ['']]]],
    [[' Zone : a '], [['zone', ['a']]]],
    [['region:eu', 'region:us'], [['region', ['eu', 'us']]]],
    [[':eu', 'a:b:c', 'a=b=c', ''], []]
  ])('reads %j', (tags, want) => {
    expect([...readTags(tags)]).toEqual(want)
  })
})
