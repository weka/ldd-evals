import { statusRank } from '../pages/Heartbeats/heartbeatFeed'
import { type Device, isOnline } from '../types/device'

/** Orders devices for a table: the healthier first, then by id. */
export function rankDevices(devices: readonly Device[]): Device[] {
  return [...devices].sort(
    (a, b) => statusRank(a.status) - statusRank(b.status) || a.id.localeCompare(b.id)
  )
}

/** Counts the devices that are up in some form. */
export function onlineCount(devices: readonly Device[]): number {
  return devices.filter(isOnline).length
}

/** Returns the device that reported least recently, or undefined for an empty fleet. */
export function quietest(devices: readonly Device[]): Device | undefined {
  return devices.reduce<Device | undefined>(
    (acc, d) => (acc === undefined || d.lastSeen < acc.lastSeen ? d : acc),
    undefined
  )
}
