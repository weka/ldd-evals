import { isRecord } from '../types/typeGuards'
import { type ApiClient, ApiError, HttpStatus } from './apiClient'

/** One alert the service raised, as the alerts endpoint lists it. */
export interface RaisedAlert {
  readonly channel: string
  readonly message: string
  readonly sentAt: Date
}

function parseRaisedAlert(raw: unknown): RaisedAlert {
  if (
    !isRecord(raw) ||
    typeof raw['channel'] !== 'string' ||
    typeof raw['message'] !== 'string' ||
    typeof raw['sent_at'] !== 'string'
  ) {
    throw new ApiError(HttpStatus.BadRequest, 'alert: malformed record')
  }
  return { channel: raw['channel'], message: raw['message'], sentAt: new Date(raw['sent_at']) }
}

/** Lists the alerts the service has sent, newest first. */
export function fetchAlerts(client: ApiClient, signal?: AbortSignal): Promise<RaisedAlert[]> {
  return client.get(
    '/alerts',
    (raw) => {
      if (!Array.isArray(raw)) {
        throw new ApiError(HttpStatus.BadRequest, 'alerts: not a list')
      }
      return raw.map(parseRaisedAlert)
    },
    { signal }
  )
}
