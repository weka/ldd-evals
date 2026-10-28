import { type Alert } from '../types/alert'
import { formatStamp } from '../utils/time'

const PAGERDUTY_URL = 'https://events.pagerduty.com/v2/enqueue'
const TIMEOUT_MS = 5000

/** A notification could not be delivered. */
export class NotifyError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'NotifyError'
  }
}

/** Notifier is a notifier. */
export class Notifier {
  private readonly timeoutMs = TIMEOUT_MS

  /** Creates a new Notifier. */
  constructor(private readonly webhookUrl: string) {}

  /**
   * Sends a message on a channel.
   *
   * A Notifier without a webhook drops the message.
   */
  async send(channel: string, msg: string): Promise<void> {
    if (!this.webhookUrl) {
      return
    }
    const payload = { channel, message: msg, sent_at: formatStamp(new Date()) }
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), this.timeoutMs)
    let res: Response
    try {
      res = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      })
    } catch (err) {
      throw new NotifyError(`webhook ${this.webhookUrl}: ${String(err)}`)
    } finally {
      clearTimeout(timer)
    }
    if (!res.ok) {
      throw new NotifyError(`webhook ${this.webhookUrl}: status ${res.status}`)
    }
  }
}

/** Sends an alert on its channel. */
export async function sendAlert(a: Alert): Promise<void> {
  switch (a.channel) {
    case 'email':
      await sendMail(a)
      break
    case 'slack':
      await postSlack(a)
      break
    case 'pagerduty':
      await pagePagerDuty(a)
      break
    default:
      throw new NotifyError(`unknown channel "${a.channel}"`)
  }
}

async function sendMail(a: Alert): Promise<void> {
  const gateway = import.meta.env.VITE_MAIL_GATEWAY
  if (!gateway) {
    return
  }
  await postJson(gateway, { to: a.recipient, subject: a.summary })
}

async function postSlack(a: Alert): Promise<void> {
  const hook = import.meta.env.VITE_SLACK_WEBHOOK
  if (!hook) {
    return
  }
  await postJson(hook, { channel: a.recipient, text: a.summary })
}

async function pagePagerDuty(a: Alert): Promise<void> {
  const key = import.meta.env.VITE_PAGERDUTY_KEY
  if (!key) {
    return
  }
  const body = {
    routing_key: key,
    event_action: 'trigger',
    payload: { summary: a.summary, source: a.recipient, severity: 'critical' }
  }
  let res: Response
  try {
    res = await fetch(PAGERDUTY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: mustJson(body)
    })
  } catch (err) {
    throw new NotifyError(`pagerduty: ${String(err)}`)
  }
  if (!res.ok) {
    throw new NotifyError(`pagerduty: status ${res.status}`)
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO
async function postJson(url: string, v: any): Promise<void> {
  const contentType = 'application/json'
  let res: Response
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': contentType },
      body: mustJson(v)
    })
  } catch (err) {
    throw new NotifyError(`post ${url}: ${String(err)}`)
  }
  if (!res.ok) {
    throw new NotifyError(`post ${url}: status ${res.status}`)
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO
function mustJson(v: any): string {
  try {
    return JSON.stringify(v)
  } catch {
    return '{}'
  }
}
