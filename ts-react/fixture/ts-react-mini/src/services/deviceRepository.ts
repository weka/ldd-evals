import { type Device } from '../types/device'
import { type ApiClient, ApiError, HttpStatus } from './apiClient'
import { fetchDevice, fetchDevices, saveDevice } from './devicesApi'

/** Raised when no device matches the tenant and id. */
export class NotFoundError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'NotFoundError'
  }
}

/** The store as the services see it; avoids an import cycle with the services package. */
export interface DeviceRepository {
  /** Returns the device, or throws NotFoundError. */
  get(tenant: string, id: string): Promise<Device>
  /** Stores the device. */
  save(d: Device): Promise<void>
  /** Returns every device. */
  list(): Promise<Device[]>
}

/** The repository over the fleet API. */
export class ApiDeviceRepository implements DeviceRepository {
  constructor(private readonly client: ApiClient) {}

  async get(tenant: string, id: string): Promise<Device> {
    try {
      return await fetchDevice(this.client, tenant, id)
    } catch (err) {
      if (err instanceof ApiError && err.status === HttpStatus.NotFound) {
        throw new NotFoundError(`device ${tenant}/${id} not found`)
      }
      throw err
    }
  }

  async save(d: Device): Promise<void> {
    await saveDevice(this.client, d)
  }

  list(): Promise<Device[]> {
    return fetchDevices(this.client)
  }
}
