import { assertNever } from './assertNever'

/**
 * The geographic region a device reports from.
 *
 * Values come from parseRegion, so a Region in circulation is always one of the
 * members below.
 */
export type Region = 'eu' | 'us' | 'ap'

const REGIONS: readonly Region[] = ['eu', 'us', 'ap']

/** Accepts the codes devices send in their region: tag. */
export function parseRegion(raw: string): Region {
  if (!isRegion(raw)) {
    throw new Error(`region "${raw}": want one of eu, us, ap`)
  }
  return raw
}

function isRegion(raw: string): raw is Region {
  return (REGIONS as readonly string[]).includes(raw)
}

/** Maps a region to the storage zone its snapshots are written to. */
export function zoneOf(region: Region): string {
  switch (region) {
    case 'eu':
      return 'eu-central-1'
    case 'us':
      return 'us-east-1'
    case 'ap':
      return 'ap-southeast-1'
    default:
      return assertNever(region)
  }
}
