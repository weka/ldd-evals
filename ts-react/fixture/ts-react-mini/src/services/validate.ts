import { type Alert } from '../types/alert'
import { sendAlert } from './notify'

/** Reports whether the alert's recipient fits its channel. */
function validRecipient(a: Alert): boolean {
  switch (a.channel) {
    case 'email':
      return a.recipient.includes('@')
    case 'slack':
      return a.recipient.startsWith('#')
    default:
      return false
  }
}

export function validateAlert(a: Alert): void {
  if (!a.channel) {
    throw new Error('alert: empty channel')
  }
  if (!a.summary) {
    throw new Error('alert: empty summary')
  }
  // eslint-disable-next-line no-magic-numbers -- TODO
  if (a.summary.length > 512) {
    throw new Error(`alert: summary of ${a.summary.length} bytes is too long`)
  }
  if (!validRecipient(a)) {
    throw new Error(`alert: bad recipient "${a.recipient}" for channel "${a.channel}"`)
  }
}

/** Validates an alert and sends it. */
export async function deliver(a: Alert): Promise<void> {
  validateAlert(a)
  await sendAlert(a)
}
