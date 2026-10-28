/** Job kinds and priorities. */
export const JOB_KIND_SNAPSHOT = 'snapshot'
export const JOB_KIND_SYNC = 'sync'

export enum Priority {
  Low = 0,
  Medium = 1,
  High = 2
}

/** Reports whether p should be scheduled ahead of o. */
export function outranks(p: Priority, o: Priority): boolean {
  return p > o
}
