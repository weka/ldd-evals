import { Priority } from './jobKind'

/**
 * Accepts the integer devices send on the wire.
 *
 * Anything outside the range the scheduler knows how to order is rejected.
 */
export function parsePriority(n: number): Priority {
  const low: number = Priority.Low
  const high: number = Priority.High
  if (n < low || n > high) {
    throw new Error(`priority ${n}: want ${low}-${high}`)
  }
  return n
}
