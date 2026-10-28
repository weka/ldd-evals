import { type Device } from '../types/device'
import { parseDevice, parseDevices } from '../types/typeGuards'
import { type ApiClient } from './apiClient'

/** Lists every device the fleet knows. */
export function fetchDevices(
  client: ApiClient,
  signal?: AbortSignal,
  headers?: Readonly<Record<string, string>>
): Promise<Device[]> {
  return client.get('/devices', parseDevices, { signal, headers })
}

/** Reads one device by tenant and id. */
export function fetchDevice(
  client: ApiClient,
  tenant: string,
  id: string,
  signal?: AbortSignal
): Promise<Device> {
  return client.get(
    `/devices/${encodeURIComponent(tenant)}/${encodeURIComponent(id)}`,
    parseDevice,
    {
      signal
    }
  )
}

/** Registers a device; the service answers with the booting record. */
// eslint-disable-next-line max-params -- TODO
export function registerDevice(
  client: ApiClient,
  id: string,
  tenant: string,
  email: string,
  tags: string[]
): Promise<Device> {
  return client.post('/devices', { id, tenant, email, tags }, parseDevice)
}

/** Writes a device record back; the service upserts by tenant and id. */
export function saveDevice(client: ApiClient, d: Device): Promise<Device> {
  return client.post(
    '/devices',
    {
      id: d.id,
      tenant: d.tenant,
      status: d.status,
      version: d.version,
      tags: d.tags,
      last_seen: d.lastSeen.toISOString()
    },
    parseDevice
  )
}
