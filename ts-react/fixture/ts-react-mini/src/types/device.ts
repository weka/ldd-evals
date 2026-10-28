/** The zero time: a device that has never been seen. */
export const NEVER = new Date(0)

/** Device is a device. */
export interface Device {
  id: string
  tenant: string
  status: string
  version: string
  tags: string[]
  lastSeen: Date
}

/** Returns whether the device is online. */
export function isOnline(d: Device): boolean {
  return d.status === 'READY' || d.status === 'DEGRADED'
}
