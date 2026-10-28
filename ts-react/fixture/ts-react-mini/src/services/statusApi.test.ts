import { describe, expect, it } from 'vitest'

import { parseStatusLine } from './statusApi'

describe('parseStatusLine', () => {
  it('reads the five counts', () => {
    expect(parseStatusLine('devices=5 ready=2 degraded=1 down=1 other=1\n')).toEqual({
      devices: 5,
      ready: 2,
      degraded: 1,
      down: 1,
      other: 1
    })
  })

  it('rejects a line missing a count', () => {
    expect(() => parseStatusLine('devices=5 ready=2')).toThrow('missing degraded')
  })
})
