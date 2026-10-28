import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { server } from '../test-utils/mocks/server'
import { ApiClient, ApiError } from './apiClient'

describe('ApiClient', () => {
  it('parses a JSON body through the parser it is given', async () => {
    server.use(http.get('/api/ping', () => HttpResponse.json({ pong: 1 })))
    const got = await new ApiClient().get('/ping', (raw) => raw as { pong: number })
    expect(got).toEqual({ pong: 1 })
  })

  it('throws an ApiError carrying the status on a failed request', async () => {
    server.use(http.get('/api/ping', () => HttpResponse.text('nope', { status: 503 })))
    const err = await new ApiClient().get('/ping', (raw) => raw).catch((e: unknown) => e)
    expect(err).toBeInstanceOf(ApiError)
    expect((err as ApiError).status).toBe(503)
  })

  it('reads plain text endpoints', async () => {
    server.use(http.get('/api/status', () => HttpResponse.text('devices=1 ready=1')))
    await expect(new ApiClient().text('/status')).resolves.toBe('devices=1 ready=1')
  })
})
