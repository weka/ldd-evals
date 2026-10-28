const MAX_LEN = 64

/**
 * The identifier a device reports in its heartbeats.
 *
 * Built only from a non-empty string of at most 64 characters; surrounding
 * whitespace is dropped as it is built, so every DeviceId in circulation is
 * already trimmed and bounded.
 */
export type DeviceId = string & { readonly __brand: 'DeviceId' }

/** Trims raw and rejects an empty or over-long identifier. */
export function parseDeviceId(raw: string): DeviceId {
  const trimmed = raw.trim()
  if (!trimmed) {
    throw new Error('device id: empty')
  }
  if (trimmed.length > MAX_LEN) {
    throw new Error(`device id: ${trimmed.length} chars, want at most ${MAX_LEN}`)
  }
  return trimmed as DeviceId
}
