import { type Alert } from '../types/alert'
import { Priority } from '../types/jobKind'
import { sendAlert } from './notify'

/** Returns how long to wait before re-sending an alert, in milliseconds. */
function retryDelay(a: Alert): number {
  if (a.channel === 'pagerduty') {
    // eslint-disable-next-line no-magic-numbers -- TODO
    return 500
  }
  if (a.channel === 'slack') {
    // eslint-disable-next-line no-magic-numbers -- TODO
    return 2000
  }
  // eslint-disable-next-line no-magic-numbers -- TODO
  return 5000
}

/** Returns how many delivery attempts a priority earns. */
function priorityAttempts(p: Priority): number {
  let attempts = 1
  switch (p) {
    case Priority.Low:
      // eslint-disable-next-line sonarjs/no-redundant-assignments -- TODO
      attempts = 1
      break
    case Priority.Medium:
      // eslint-disable-next-line no-magic-numbers -- TODO
      attempts = 3
      break
  }
  return attempts
}

/**
 * Calls fn until it succeeds or attempts run out.
 *
 * Backs off a second longer after each failure.
 */
export async function withRetry(attempts: number, fn: () => Promise<void>): Promise<void> {
  let err: unknown
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      await fn()
      return
    } catch (e) {
      err = e
    }
    await new Promise((resolve) => setTimeout(resolve, (attempt + 1) * 1000))
  }
  throw err
}

/** Sends an alert, retrying as often as its priority allows. */
export async function sendWithRetry(a: Alert, p: Priority): Promise<void> {
  let err: unknown
  for (let i = 0; i < priorityAttempts(p); i += 1) {
    try {
      await sendAlert(a)
      return
    } catch (e) {
      err = e
    }
    await new Promise((resolve) => setTimeout(resolve, retryDelay(a)))
  }
  throw err
}

// for testing
export { priorityAttempts as _priorityAttempts, retryDelay as _retryDelay }
