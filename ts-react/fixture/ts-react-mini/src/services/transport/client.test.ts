import { describe, expect, it } from 'vitest'

import { Client } from './client'

describe('Client', () => {
  it.each([
    ['db', 5432, false, 'http://db:5432/healthz'],
    ['db', 5432, true, 'https://db:5432/healthz'],
    ['db', 70000, false, 'http://db:8080/healthz'],
    ['db', 0, true, 'https://db:8080/healthz']
  ])('health url for %s:%d tls=%s', (host, port, tls, want) => {
    expect(new Client(host, port, tls).healthUrl()).toBe(want)
  })
})
