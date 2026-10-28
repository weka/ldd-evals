/** Shared time helpers. */

const MS_PER_DAY = 86_400_000
const MS_PER_SECOND = 1000

/** Returns the number of whole days from a to b. */
export function daysBetween(a: Date, b: Date): number {
  let from = a
  let to = b
  if (b < a) {
    from = b
    to = a
  }
  return Math.floor((to.getTime() - from.getTime()) / MS_PER_DAY)
}

/** Formats a time the way the fleet service writes it: UTC, second precision, a Z suffix. */
export function formatStamp(t: Date): string {
  return t.toISOString().replace(/\.\d{3}Z$/, 'Z')
}

/** Renders a duration in whole seconds, as the status line shows uptime. */
export function seconds(ms: number): string {
  return `${Math.floor(ms / MS_PER_SECOND)}s`
}
