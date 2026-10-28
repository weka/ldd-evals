const HOURS_PER_DAY = 24
const MINUTES_PER_HOUR = 60
const MINUTES_PER_DAY = HOURS_PER_DAY * MINUTES_PER_HOUR

/**
 * A daily time-of-day interval during which snapshots may be taken.
 *
 * A window that ends before it starts wraps past midnight. Both ends are minutes
 * since midnight and are checked as the Window is built, so a Window in
 * circulation is never empty and never points outside the day.
 */
export class Window {
  private constructor(
    readonly start: number, // minutes since midnight
    readonly end: number // minutes since midnight
  ) {
    for (const [name, minutes] of [
      ['start', start],
      ['end', end]
    ] as const) {
      if (minutes < 0 || minutes >= MINUTES_PER_DAY) {
        throw new Error(`window ${name}: ${minutes} minutes is outside the day`)
      }
    }
    if (start === end) {
      throw new Error(`window ${this.toString()} is empty`)
    }
  }

  /** Builds a Window from two "HH:MM" clock times. */
  static parse(start: string, end: string): Window {
    let s: number
    let e: number
    try {
      s = parseClock(start)
    } catch (err) {
      throw new Error(`window start: ${String(err instanceof Error ? err.message : err)}`)
    }
    try {
      e = parseClock(end)
    } catch (err) {
      throw new Error(`window end: ${String(err instanceof Error ? err.message : err)}`)
    }
    return new Window(s, e)
  }

  /** Reports whether t falls inside the window. */
  contains(t: Date): boolean {
    const m = t.getUTCHours() * MINUTES_PER_HOUR + t.getUTCMinutes()
    if (this.start < this.end) {
      return this.start <= m && m < this.end
    }
    return m >= this.start || m < this.end
  }

  /** Returns how long the window stays open each day, in minutes. */
  duration(): number {
    let span = this.end - this.start
    if (span < 0) {
      span += MINUTES_PER_DAY
    }
    return span
  }

  toString(): string {
    return `${clock(this.start)}-${clock(this.end)}`
  }
}

function parseClock(v: string): number {
  const m = /^(\d{2}):(\d{2})$/.exec(v)
  if (m === null) {
    throw new Error(`clock time "${v}": want HH:MM`)
  }
  const hours = Number(m[1])
  const minutes = Number(m[2])
  if (hours >= HOURS_PER_DAY || minutes >= MINUTES_PER_HOUR) {
    throw new Error(`clock time "${v}": want HH:MM`)
  }
  return hours * MINUTES_PER_HOUR + minutes
}

function clock(minutes: number): string {
  const h = Math.floor(minutes / MINUTES_PER_HOUR)
  const m = minutes % MINUTES_PER_HOUR
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

/** The set of windows during which a device may be snapshotted. */
export class WindowPlan {
  private readonly list: readonly Window[]

  /**
   * Builds a WindowPlan from at least one window.
   *
   * The plan keeps its own copy so later changes to the caller's array cannot
   * reorder or shrink it.
   */
  constructor(windows: readonly Window[]) {
    if (windows.length === 0) {
      throw new Error('plan: no windows')
    }
    this.list = [...windows]
  }

  /** Reports whether any window of the plan contains t. */
  open(t: Date): boolean {
    return this.list.some((w) => w.contains(t))
  }

  /**
   * Returns the plan's windows.
   *
   * Callers get their own copy: the plan is shared by the scheduler and the
   * settings page, and neither may edit it.
   */
  windows(): Window[] {
    return [...this.list]
  }
}
