import { afterEach, describe, expect, it, vi } from 'vitest'

import { checkWebhook } from './webhook'

const ENV: Record<string, string> = { EMPTY: '', HOOK: 'alerts' }
const lookup = (name: string): string | undefined => ENV[name]

function stubFetch(config: string, postStatus = 204): ReturnType<typeof vi.fn> {
  const fetchMock = vi.fn((_url: string, init?: RequestInit) =>
    Promise.resolve(
      init?.method === 'POST' ? new Response(null, { status: postStatus }) : new Response(config)
    )
  )
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

describe('checkWebhook', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it.each([
    ['${HOOK}', 'https://hooks.test/alerts'],
    ['$HOOK', 'https://hooks.test/alerts'],
    ['${MISSING:-fallback}', 'https://hooks.test/fallback'],
    ['${EMPTY:-fallback}', 'https://hooks.test/fallback'],
    ['x${EMPTY-fallback}', 'https://hooks.test/x'],
    ['${MISSING-fallback}', 'https://hooks.test/fallback'],
    ['$$HOOK', 'https://hooks.test/$HOOK']
  ])('expands the endpoint template %s', async (template, want) => {
    const fetchMock = stubFetch(`https://hooks.test/${template}/`)
    const res = await checkWebhook('/webhook.conf', lookup)
    expect(res.status).toBe(204)
    expect(fetchMock).toHaveBeenLastCalledWith(want, { method: 'POST' })
  })

  it('throws on a failure status', async () => {
    stubFetch('https://hooks.test/', 502)
    await expect(checkWebhook('/webhook.conf', lookup)).rejects.toThrow('status 502')
  })
})
