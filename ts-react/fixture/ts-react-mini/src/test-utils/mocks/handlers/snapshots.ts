import { http, HttpResponse } from 'msw'

export const snapshotHandlers = [
  http.get('/api/snapshots', ({ request }) => {
    const device = new URL(request.url).searchParams.get('device')
    if (device !== 'a') {
      return HttpResponse.json([])
    }
    return HttpResponse.json([
      { id: 'a-1709250000', device_id: 'a', created_at: '2024-03-01T00:00:00Z' },
      { id: 'a-1709290000', device_id: 'a', created_at: '2024-03-01T11:00:00Z' }
    ])
  })
]
