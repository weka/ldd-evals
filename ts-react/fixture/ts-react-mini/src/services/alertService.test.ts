import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { AuditLog } from '../pages/Heartbeats/heartbeatFeed'
import { server } from '../test-utils/mocks/server'
import { type Device } from '../types/device'
import { AlertService } from './alertService'
import { Notifier } from './notify'

function device(status: string): Device {
  return { id: 'd1', tenant: 'acme', status, version: '', tags: [], lastSeen: new Date() }
}

describe('AlertService', () => {
  it('raises nothing for a ready device', async () => {
    const svc = new AlertService(new Notifier(''), new AuditLog(undefined), 'plain')
    await svc.raiseAlert(device('READY'))
    expect(svc.raisedCount()).toBe(0)
    expect(svc.receivedCount()).toBe(1)
  })

  it('pages for a device that is down and audits the alert as JSON', async () => {
    const posts: unknown[] = []
    server.use(
      http.post('/api/alerts', async ({ request }) => {
        posts.push(await request.json())
        return new HttpResponse(null, { status: 202 })
      })
    )
    const lines: string[] = []
    const svc = new AlertService(
      new Notifier('/api/alerts'),
      new AuditLog((l) => lines.push(l)),
      'json'
    )
    await svc.raiseAlert(device('DOWN'))
    expect(svc.raisedCount()).toBe(1)
    expect(posts).toHaveLength(1)
    expect(lines[0]).toContain('application/json {"channel":"pagerduty"')
  })

  it('rejects a status it has no alert for', async () => {
    const svc = new AlertService(new Notifier(''), new AuditLog(undefined), 'plain')
    await expect(svc.raiseAlert(device('BOOTING'))).rejects.toThrow('no alert')
  })
})
