import { useEffect, useState } from 'react'

import { CONFIG } from '../config/env'
import { useServices } from '../context/ServicesContext'
import { AuditLog } from '../pages/Heartbeats/heartbeatFeed'
import { SnapshotService } from '../services/snapshotService'

/**
 * Takes a snapshot of what the console sees every poll interval while a page
 * is open, so the snapshot tab has something to show for devices the service
 * has not snapshotted yet.
 */
export function useSnapshotScheduler(): void {
  const { repo, audit } = useServices()
  const [service] = useState(() => new SnapshotService(repo, new AuditLog(audit)))

  useEffect(() => {
    if (CONFIG.batchSize <= 0 || CONFIG.numWorkers <= 0) {
      return undefined
    }
    async function tick() {
      try {
        await service.run()
      } catch (err) {
        console.warn(`snapshot scheduler: ${String(err)}`)
      }
    }
    const timer = setInterval(() => {
      void tick()
    }, CONFIG.pollMs)
    return () => {
      clearInterval(timer)
    }
  }, [service])
}
