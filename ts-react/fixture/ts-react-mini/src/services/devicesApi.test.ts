import { describe, expect, it } from 'vitest'

import { apiClient } from './apiClient'
import { fetchDevice, fetchDevices } from './devicesApi'

describe('devicesApi', () => {
  it('lists the seeded fleet', async () => {
    const devices = await fetchDevices(apiClient)
    expect(devices.map((d) => d.id)).toEqual(['a', 'b', 'c', 'd', 'e'])
    expect(devices[0]?.lastSeen).toBeInstanceOf(Date)
  })

  it('reads one device by tenant and id', async () => {
    const d = await fetchDevice(apiClient, 'beta', 'd')
    expect(d.status).toBe('DOWN')
  })

  it('rejects an unknown device with the status the service answered', async () => {
    await expect(fetchDevice(apiClient, 'beta', 'ghost')).rejects.toMatchObject({ status: 404 })
  })
})
