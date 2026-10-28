import { http, HttpResponse } from 'msw'

export const statusHandlers = [
  http.get('/api/status', () => HttpResponse.text('devices=5 ready=2 degraded=1 down=1 other=1\n'))
]
