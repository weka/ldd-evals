import { useCallback, useEffect, useState } from 'react'

import { useServices } from '../../context/ServicesContext'
import { HttpStatus } from '../../services/apiClient'
import { type Heartbeat } from '../../types/heartbeat'
import { AuditLog, FeedStore, ScratchFleet, type Stats } from './heartbeatFeed'
import { type SimulatedRequest, type SimulatedResponse, simulateRequest } from './simulateRequest'

export interface Simulator {
  readonly last: SimulatedResponse | undefined
  readonly applied: readonly Heartbeat[]
  readonly busy: boolean
  readonly stats: Stats | undefined
  readonly apply: (req: SimulatedRequest) => Promise<void>
}

/**
 * Owns the simulator's feed for the life of the page: lines applied in sequence
 * see each other's effects, exactly as the service's store would, and a new
 * visit starts from an empty fleet.
 */
export function useHeartbeatSimulator(): Simulator {
  const { notifier, audit } = useServices()
  const [feed] = useState(() => new FeedStore(new ScratchFleet(), notifier, new AuditLog(audit)))
  const [last, setLast] = useState<SimulatedResponse>()
  const [applied, setApplied] = useState<Heartbeat[]>([])
  const [busy, setBusy] = useState(false)
  const [stats, setStats] = useState<Stats>()

  useEffect(() => {
    return () => {
      feed.close()
    }
  }, [feed])

  const apply = useCallback(
    async (req: SimulatedRequest) => {
      setBusy(true)
      try {
        const res = await simulateRequest(feed, req)
        setLast(res)
        setApplied((log) => [...log, heartbeatOf(req, res)])
        setStats(feed.stats())
      } finally {
        setBusy(false)
      }
    },
    [feed]
  )

  return { last, applied, busy, stats, apply }
}

function heartbeatOf(req: SimulatedRequest, res: SimulatedResponse): Heartbeat {
  const [deviceId = '', status = '', version = '', tags = ''] = req.line.split('|')
  return {
    deviceId: deviceId.trim(),
    tenant: req.tenant || 'default',
    status: res.status === HttpStatus.Ok ? status.trim().toUpperCase() : 'REJECTED',
    version: version.trim(),
    tags: tags ? tags.split(',').map((t) => t.trim()) : [],
    receivedAt: new Date(),
    raw: req.line
  }
}
