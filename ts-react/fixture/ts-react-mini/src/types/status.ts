/** Device status values as they travel on the wire. */
export const STATUSES = ['READY', 'DEGRADED', 'DOWN', 'BOOTING'] as const

export const [STATUS_READY, STATUS_DEGRADED, STATUS_DOWN, STATUS_BOOTING] = STATUSES

/** Checks whether the status is valid. */
export function isValidStatus(s: string): boolean {
  return (STATUSES as readonly string[]).includes(s)
}
