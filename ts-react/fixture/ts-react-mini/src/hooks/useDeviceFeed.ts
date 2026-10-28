import { useEffect, useState } from 'react'

import { useDevices } from './useDevices'

const QUIET_AFTER = 2

/** Polls the fleet and reports which devices went quiet since the last tick. */
export function useDeviceFeed(pollMs: number): readonly string[] {
  const [quiet, setQuiet] = useState<readonly string[]>([])
  const { data } = useDevices(pollMs)

  useEffect(() => {
    setInterval(() => {
      const now = Date.now()
      setQuiet(
        (data ?? [])
          .filter((d) => now - d.lastSeen.getTime() > pollMs * QUIET_AFTER)
          .map((d) => d.id)
      )
    }, pollMs)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- TODO
  }, [pollMs])

  return quiet
}
