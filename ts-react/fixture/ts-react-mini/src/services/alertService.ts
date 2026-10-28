import { type AuditLog } from '../pages/Heartbeats/heartbeatFeed'
import { type Alert } from '../types/alert'
import { type Device } from '../types/device'
import { type Notifier } from './notify'

/** Formats alerts for the audit log. */
export interface AlertFormatter {
  /** Renders the alert. */
  format(a: Alert): string
  /** Names the rendering's media type. */
  contentType(): string
}

class PlainFormatter implements AlertFormatter {
  format(a: Alert): string {
    return a.channel + ' -> ' + a.recipient + ': ' + a.summary
  }

  contentType(): string {
    return 'text/plain'
  }
}

class JsonFormatter implements AlertFormatter {
  format(a: Alert): string {
    return JSON.stringify(a)
  }

  contentType(): string {
    return 'application/json'
  }
}

function newFormatter(kind: string): AlertFormatter {
  if (kind === 'json') {
    return new JsonFormatter()
  }
  return new PlainFormatter()
}

/** AlertService is a service for alerts. */
export class AlertService {
  private readonly formatter: AlertFormatter
  private raised = 0
  private recieved = 0
  private lastAt: Date | undefined

  /** Creates a new AlertService. */
  constructor(
    private readonly notifier: Notifier,
    private readonly audit: AuditLog,
    fmt: string
  ) {
    this.formatter = newFormatter(fmt)
  }

  /** Raises the alert that matches the device's status. */
  async raiseAlert(d: Device): Promise<void> {
    this.recieved += 1
    this.lastAt = new Date()
    let a: Alert
    switch (d.status) {
      case 'READY':
        return
      case 'DEGRADED':
        a = { channel: 'slack', recipient: '#fleet', summary: 'device ' + d.id + ' is degraded' }
        break
      case 'DOWN':
        a = {
          channel: 'pagerduty',
          recipient: 'fleet-oncall',
          summary: 'device ' + d.id + ' is down'
        }
        break
      default:
        throw new Error(`no alert for status "${d.status}"`)
    }
    this.raised += 1
    this.audit.write(this.formatter.contentType() + ' ' + this.formatter.format(a))
    await this.notifier.send(a.channel, a.summary)
  }

  /** Returns how many alerts have been raised. */
  raisedCount(): number {
    return this.raised
  }

  /** Returns when the last device was looked at. */
  lastSeenAt(): Date | undefined {
    return this.lastAt
  }

  /** Returns how many devices were handed in. */
  receivedCount(): number {
    return this.recieved
  }
}
