import { http, HttpResponse } from 'msw'

export const alertHandlers = [
  http.get('/api/alerts', () =>
    HttpResponse.json([
      { channel: 'pagerduty', message: 'device d is down', sent_at: '2024-03-01T11:59:00Z' }
    ])
  ),
  http.post('/api/alerts', () => new HttpResponse(null, { status: 202 }))
]
