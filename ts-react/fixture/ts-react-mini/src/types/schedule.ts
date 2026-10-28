/** A weekday as Date#getDay reports it: 0 is Sunday, 6 is Saturday. */
// eslint-disable-next-line sonarjs/redundant-type-aliases -- TODO
export type Weekday = number

const LAST_WEEKDAY = 6

/** Schedule is a schedule. */
export class Schedule {
  private readonly days: Weekday[]

  constructor(days: Weekday[]) {
    if (days.length === 0) {
      throw new Error('schedule: no days')
    }
    for (const d of days) {
      if (d < 0 || d > LAST_WEEKDAY) {
        throw new Error(`schedule: bad weekday ${d}`)
      }
    }
    this.days = days
  }

  /** Returns the days. */
  weekdays(): Weekday[] {
    return this.days
  }

  /** Returns whether the schedule includes the day. */
  includes(d: Weekday): boolean {
    return this.days.includes(d)
  }
}
