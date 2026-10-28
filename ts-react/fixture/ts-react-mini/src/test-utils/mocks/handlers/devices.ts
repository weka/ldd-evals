import { http, HttpResponse } from 'msw'

/** A device record as the fleet API serializes it. */
export interface DeviceWire {
  id: string
  tenant: string
  status: string
  version: string
  tags: string[]
  last_seen: string
}

const NOW = '2024-03-01T12:00:00Z'

/** The five devices every device test starts from. */
export function seededDevices(): DeviceWire[] {
  return [
    { id: 'a', tenant: 'acme', status: 'READY', version: '1.0', tags: ['gpu'], last_seen: NOW },
    { id: 'b', tenant: 'acme', status: 'READY', version: '1.0', tags: [], last_seen: NOW },
    {
      id: 'c',
      tenant: 'acme',
      status: 'DEGRADED',
      version: '0.9',
      tags: ['cluster:lab-1'],
      last_seen: NOW
    },
    {
      id: 'd',
      tenant: 'beta',
      status: 'DOWN',
      version: '2.0',
      tags: ['region:eu'],
      last_seen: NOW
    },
    { id: 'e', tenant: 'gamma', status: 'BOOTING', version: '', tags: [], last_seen: NOW }
  ]
}

export const deviceHandlers = [
  http.get('/api/devices', () => HttpResponse.json(seededDevices())),
  http.get('/api/devices/:tenant/:id', ({ params }) => {
    const found = seededDevices().find(
      (d) => d.tenant === params['tenant'] && d.id === params['id']
    )
    if (found === undefined) {
      return HttpResponse.text('not found', { status: 404 })
    }
    return HttpResponse.json(found)
  }),
  http.post('/api/devices', async ({ request }) => {
    const body = (await request.json()) as Partial<DeviceWire>
    return HttpResponse.json(
      {
        id: body.id ?? '',
        tenant: body.tenant ?? '',
        status: body.status ?? 'BOOTING',
        version: body.version ?? '',
        tags: body.tags ?? [],
        last_seen: body.last_seen ?? NOW
      },
      { status: 201 }
    )
  }),
  http.post('/api/heartbeat', () => HttpResponse.json({ accepted: true }))
]
