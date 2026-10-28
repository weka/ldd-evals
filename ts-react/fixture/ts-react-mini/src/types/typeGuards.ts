import { ApiError } from '../services/apiClient'
import { type Device } from './device'

/** Narrows a decoded JSON value to an object with string keys. */
export function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((x) => typeof x === 'string')
}

const UNPROCESSABLE = 422

function field(raw: Record<string, unknown>, name: string): string {
  const v = raw[name]
  if (typeof v !== 'string') {
    throw new ApiError(UNPROCESSABLE, `device: missing ${name}`)
  }
  return v
}

/** Parses one device record as the fleet API sends it; anything malformed is an ApiError. */
export function parseDevice(raw: unknown): Device {
  if (!isRecord(raw)) {
    throw new ApiError(UNPROCESSABLE, 'device: not an object')
  }
  const tags = raw['tags'] ?? []
  if (!isStringArray(tags)) {
    throw new ApiError(UNPROCESSABLE, 'device: tags must be strings')
  }
  const lastSeen = new Date(field(raw, 'last_seen'))
  if (Number.isNaN(lastSeen.getTime())) {
    throw new ApiError(UNPROCESSABLE, 'device: bad last_seen')
  }
  return {
    id: field(raw, 'id'),
    tenant: field(raw, 'tenant'),
    status: field(raw, 'status'),
    version: typeof raw['version'] === 'string' ? raw['version'] : '',
    tags,
    lastSeen
  }
}

/** Parses the device list endpoint's body. */
export function parseDevices(raw: unknown): Device[] {
  if (!Array.isArray(raw)) {
    throw new ApiError(UNPROCESSABLE, 'devices: not a list')
  }
  return raw.map(parseDevice)
}
