import { describe, expect, it } from 'vitest'

import { traceFromSearch, withTrace } from './trace'

describe('trace', () => {
  it('adds the header when a trace id is present', () => {
    expect(withTrace({ Accept: 'text/plain' }, 'abc-123')).toEqual({
      Accept: 'text/plain',
      'X-Trace': 'abc-123'
    })
  })

  it('leaves the headers alone without one', () => {
    const headers = { Accept: 'text/plain' }
    expect(withTrace(headers, '')).toBe(headers)
    expect(traceFromSearch(new URLSearchParams(''))).toBe('')
  })
})
