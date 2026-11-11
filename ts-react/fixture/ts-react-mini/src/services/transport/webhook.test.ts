import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { server } from '../../test-utils/mocks/server'
import { checkWebhook } from './webhook'

const CONFIG_URL = 'http://config.local/webhook.conf'

const ENV: Record<string, string> = { EMPTY: '', HOOK: 'alerts' }

function lookup(name: string): string | undefined {
  return ENV[name]
}

function serveHook(template: string, postStatus: number): string[] {
  const posted: string[] = []
  server.use(
    http.get(CONFIG_URL, () => HttpResponse.text(template)),
    http.post('https://hooks.test/*', ({ request }) => {
      posted.push(request.url)
      return new HttpResponse(null, { status: postStatus })
    })
  )
  return posted
}

describe('checkWebhook', () => {
  it.each([
    ['${HOOK}', 'https://hooks.test/alerts'],
    ['$HOOK', 'https://hooks.test/alerts'],
    ['${MISSING:-fallback}', 'https://hooks.test/fallback'],
    ['${EMPTY:-fallback}', 'https://hooks.test/fallback'],
    ['x${EMPTY-fallback}', 'https://hooks.test/x'],
    ['${MISSING-fallback}', 'https://hooks.test/fallback'],
    ['$$HOOK', 'https://hooks.test/$HOOK']
  ])('expands the endpoint template %s', async (template, want) => {
    const posted = serveHook(`https://hooks.test/${template}/`, 204)
    const res = await checkWebhook(CONFIG_URL, lookup)
    expect(res.status).toBe(204)
    expect(posted).toEqual([want])
  })

  it('throws on a failure status', async () => {
    serveHook('https://hooks.test/', 502)
    await expect(checkWebhook(CONFIG_URL, lookup)).rejects.toThrow('status 502')
  })
})
