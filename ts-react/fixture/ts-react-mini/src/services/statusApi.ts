import { type ApiClient, ApiError, HttpStatus } from './apiClient'

/** The counts the fleet status line carries. */
export interface FleetStatus {
  readonly devices: number
  readonly ready: number
  readonly degraded: number
  readonly down: number
  readonly other: number
}

const FIELDS = ['devices', 'ready', 'degraded', 'down', 'other'] as const

/** Parses `devices=5 ready=2 degraded=1 down=1 other=1`, the line GET /status answers. */
export function parseStatusLine(line: string): FleetStatus {
  const values = new Map<string, number>()
  for (const pair of line.trim().split(/\s+/)) {
    const [key, value] = pair.split('=')
    const n = Number(value)
    if (key !== undefined && value !== undefined && Number.isInteger(n)) {
      values.set(key, n)
    }
  }
  const counts: Partial<Record<(typeof FIELDS)[number], number>> = {}
  for (const name of FIELDS) {
    const n = values.get(name)
    if (n === undefined) {
      throw new ApiError(HttpStatus.BadRequest, `status: missing ${name} in "${line}"`)
    }
    counts[name] = n
  }
  return counts as FleetStatus
}

/** Reads the fleet status line. */
export async function fetchStatus(client: ApiClient, signal?: AbortSignal): Promise<FleetStatus> {
  return parseStatusLine(await client.text('/status', { signal }))
}
