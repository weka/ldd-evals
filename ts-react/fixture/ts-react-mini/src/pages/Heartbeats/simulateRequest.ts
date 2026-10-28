import { HttpStatus } from '../../services/apiClient'
import { type FeedStore, processHeartbeat } from './heartbeatFeed'

// Bounds a heartbeat line; the longest legitimate line is well under a kilobyte.
const MAX_HEARTBEAT_BYTES = 4096

// The tenant a request without an X-Tenant header lands under.
const DEFAULT_TENANT = 'default'

/** One heartbeat request as a device would send it: the body line, the tenant header, ?force=1. */
export interface SimulatedRequest {
  readonly line: string
  /** Empty sends no X-Tenant header. */
  readonly tenant: string
  readonly force: boolean
}

/** What POST /heartbeat answers: the status code and the compact JSON body. */
export interface SimulatedResponse {
  readonly status: number
  readonly body: string
}

/**
 * Answers one heartbeat line the way the fleet service's POST /heartbeat does.
 *
 * The body is one raw heartbeat line, the tenant comes from the X-Tenant header
 * and ?force=1 forces the reported status through.
 */
export async function simulateRequest(
  feed: FeedStore,
  req: SimulatedRequest
): Promise<SimulatedResponse> {
  if (new TextEncoder().encode(req.line).length > MAX_HEARTBEAT_BYTES) {
    return json(HttpStatus.BadRequest, { error: 'unreadable body' })
  }
  const tenant = req.tenant || DEFAULT_TENANT
  const [id, score, changed, tags, err] = await processHeartbeat(feed, req.line, tenant, req.force)
  if (err !== undefined) {
    return json(HttpStatus.BadRequest, { error: err })
  }
  return json(HttpStatus.Ok, { id, score, changed, tags: tags ?? [] })
}

function json(status: number, v: unknown): SimulatedResponse {
  return { status, body: JSON.stringify(v) }
}
