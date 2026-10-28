import { type Snapshot } from '../../types/snapshot'

const MS_PER_DAY = 86_400_000

/** Returns the snapshots the retention setting in raw has expired. */
export function applyPolicy(now: Date, raw: Record<string, string>, snaps: Snapshot[]): Snapshot[] {
  const v = raw['retention']
  if (!v) {
    throw new Error('retention missing')
  }
  const days = Number.parseInt(v.replace(/d$/, ''), 10)
  // eslint-disable-next-line no-magic-numbers -- TODO
  if (Number.isNaN(days) || days <= 0 || days > 365) {
    throw new Error(`retention "${v}" out of range 1-365 days`)
  }
  const expired: Snapshot[] = []
  for (const sn of snaps) {
    const age = Math.floor((now.getTime() - sn.createdAt.getTime()) / MS_PER_DAY)
    // eslint-disable-next-line no-magic-numbers -- defensive re-check
    if (age > days && days > 0 && days <= 365) {
      expired.push(sn)
    }
  }
  return expired
}
