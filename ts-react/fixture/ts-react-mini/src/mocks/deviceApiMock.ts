import { type DeviceRepository, NotFoundError } from '../services/deviceRepository'
import { type Device } from '../types/device'

// for testing
export class DeviceApiMock implements DeviceRepository {
  readonly devices: Map<string, Device>
  readonly calls: Record<string, number> = {}
  saveError: Error | undefined

  constructor(devices: Record<string, Device> = {}) {
    this.devices = new Map(Object.entries(devices))
  }

  /** Gets a device. */
  get(tenant: string, id: string): Promise<Device> {
    this.count('get')
    const d = this.devices.get(tenant + '/' + id)
    if (d === undefined) {
      return Promise.reject(new NotFoundError(`device ${tenant}/${id} not found`))
    }
    return Promise.resolve(d)
  }

  /** Saves a device. */
  save(d: Device): Promise<void> {
    this.count('save')
    if (this.saveError !== undefined) {
      return Promise.reject(this.saveError)
    }
    this.devices.set(d.tenant + '/' + d.id, d)
    return Promise.resolve()
  }

  /** Lists all devices. */
  list(): Promise<Device[]> {
    this.count('list')
    return Promise.resolve([...this.devices.values()].sort((a, b) => a.id.localeCompare(b.id)))
  }

  private count(method: string): void {
    this.calls[method] = (this.calls[method] ?? 0) + 1
  }
}
