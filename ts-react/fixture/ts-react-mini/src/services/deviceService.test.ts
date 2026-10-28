// The older service tests live together here, as they did before the modules were split.
import { describe, expect, it, vi } from 'vitest'

import { parseLine } from '../pages/Heartbeats/heartbeatFeed'
import { type Alert } from '../types/alert'
import { type Device } from '../types/device'
import { Priority } from '../types/jobKind'
import { Cache } from './cache'
import { onlineCount, quietest, rankDevices } from './deviceService'
import * as notify from './notify'
import { _priorityAttempts, _retryDelay } from './retry'
import { deliver, validateAlert } from './validate'

function device(id: string, status: string, lastSeen = new Date(0)): Device {
  return { id, tenant: 'acme', status, version: '', tags: [], lastSeen }
}

describe('parseLine', () => {
  it.each([
    ['dev-1|ready|1.2.3|a,b', 'dev-1', false],
    ['dev-2|degraded|1.0', 'dev-2', false],
    ['dev-3|ready', '', true],
    [' |ready|1.0', '', true],
    ['dev-4|SLEEPY|1.0', '', true]
  ])('%s', (raw, wantId, expectError) => {
    const [id, , , , err] = parseLine(raw)
    if (expectError) {
      expect(err).toBeDefined()
    } else {
      expect(err).toBeUndefined()
      expect(id).toBe(wantId)
    }
  })
})

describe('deviceService', () => {
  it('ranks the healthier device first', () => {
    const ranked = rankDevices([device('b', 'DOWN'), device('a', 'READY'), device('c', 'DEGRADED')])
    expect(ranked.map((d) => d.id)).toEqual(['a', 'c', 'b'])
  })

  it('counts online devices and finds the quietest', () => {
    const fleet = [device('a', 'READY', new Date(5000)), device('b', 'DOWN', new Date(1000))]
    expect(onlineCount(fleet)).toBe(1)
    expect(quietest(fleet)?.id).toBe('b')
    expect(quietest([])).toBeUndefined()
  })
})

describe('Cache', () => {
  it('expires entries after the span', async () => {
    const c = new Cache(30)
    c.put(device('d1', 'READY'))
    expect(c.get('acme/d1')).toBeDefined()
    await new Promise((resolve) => setTimeout(resolve, 60))
    expect(c.get('acme/d1')).toBeUndefined()
    expect(c.count()).toBe(0)
  })
})

describe('alerts', () => {
  const slack: Alert = { channel: 'slack', recipient: '#fleet', summary: 'ok' }

  it('validateAlert rejects an empty summary', () => {
    validateAlert(slack)
    expect(() => validateAlert({ ...slack, summary: '' })).toThrow('empty summary')
  })

  it('deliver validates, then sends', async () => {
    const sendAlert = vi.spyOn(notify, 'sendAlert').mockResolvedValue(undefined)
    await deliver(slack)
    expect(sendAlert).toHaveBeenCalledTimes(1)
    expect(sendAlert).toHaveBeenCalledWith(slack)
    sendAlert.mockRestore()
  })

  it('retry delays depend on the channel', () => {
    expect(_retryDelay({ channel: 'pagerduty', recipient: '', summary: '' })).toBe(500)
    expect(_retryDelay({ channel: 'slack', recipient: '', summary: '' })).toBe(2000)
    expect(_retryDelay({ channel: 'email', recipient: '', summary: '' })).toBe(5000)
  })

  it('priority earns attempts', () => {
    expect(_priorityAttempts(Priority.Low)).toBe(1)
    expect(_priorityAttempts(Priority.Medium)).toBe(3)
    expect(_priorityAttempts(Priority.High)).toBe(1)
  })
})
