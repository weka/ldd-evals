import { http, HttpResponse } from 'msw'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { server } from '../test-utils/mocks/server'
import { Notifier, NotifyError, sendAlert } from './notify'

describe('Notifier', () => {
  it('posts the channel, the message and a stamp as JSON', async () => {
    let seen: unknown
    server.use(
      http.post('http://hooks.local/ops', async ({ request }) => {
        seen = await request.json()
        return new HttpResponse(null, { status: 202 })
      })
    )
    await new Notifier('http://hooks.local/ops').send('ops', 'device d1 is down')
    expect(seen).toMatchObject({ channel: 'ops', message: 'device d1 is down' })
    expect((seen as { sent_at: string }).sent_at).toMatch(/Z$/)
  })

  it('rejects a server error', async () => {
    server.use(http.post('http://hooks.local/ops', () => new HttpResponse(null, { status: 500 })))
    await expect(new Notifier('http://hooks.local/ops').send('ops', 'x')).rejects.toBeInstanceOf(
      NotifyError
    )
  })

  it('drops the message without a webhook', async () => {
    await expect(new Notifier('').send('ops', 'x')).resolves.toBeUndefined()
  })
})

describe('sendAlert', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('rejects an unknown channel', async () => {
    await expect(
      sendAlert({ channel: 'sms', recipient: '+15550100', summary: 'hi' })
    ).rejects.toThrow('unknown channel')
  })

  it('posts slack alerts to the configured hook', async () => {
    vi.stubEnv('VITE_SLACK_WEBHOOK', 'http://hooks.local/slack')
    let seen: unknown
    server.use(
      http.post('http://hooks.local/slack', async ({ request }) => {
        seen = await request.json()
        return new HttpResponse(null, { status: 200 })
      })
    )
    await sendAlert({ channel: 'slack', recipient: '#fleet', summary: 'degraded' })
    expect(seen).toEqual({ channel: '#fleet', text: 'degraded' })
  })
})
