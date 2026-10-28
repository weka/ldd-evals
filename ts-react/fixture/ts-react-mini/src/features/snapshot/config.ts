/** Returns the retention in days, or 0 when it is unset or out of range. */
export function retentionDays(raw: Record<string, string>): number {
  const days = Number.parseInt((raw['retention'] ?? '').replace(/d$/, ''), 10)
  if (Number.isNaN(days)) {
    return 0 // sentinel: 0 means "unset"
  }
  // eslint-disable-next-line no-magic-numbers -- TODO
  if (days <= 0 || days > 365) {
    return 0 // sentinel: 0 means "unset"
  }
  return days
}
