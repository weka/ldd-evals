import { formatStamp } from '../../utils/time'

export type Clock = () => Date

const UNSTAMPED = new Date(0)

function now(): Date {
  return new Date()
}

/** The reporter options. */
export interface Options {
  flushEveryMs: number
}

/** A reported event. */
export class ReportEvent {
  constructor(
    readonly kind: string,
    readonly subject: string,
    readonly stamp: Date = UNSTAMPED
  ) {}

  /** Returns the event stamped with t. */
  at(t: Date): ReportEvent {
    return new ReportEvent(this.kind, this.subject, t)
  }

  /** Returns when the event was recorded. */
  time(): Date {
    return this.stamp
  }
}

/** Where events are written. */
export class Sink {
  /** Creates a new Sink. */
  constructor(private readonly out: (line: string) => void) {}

  /** Writes the event. */
  write(ev: ReportEvent): void {
    this.out(`${formatStamp(ev.stamp)} ${ev.kind} ${ev.subject}\n`)
  }
}

/** Reporter is a reporter. */
export class Reporter {
  sink: Sink | undefined // public, might be undefined: "optional"
  clock: Clock | undefined // undefined means "use now"
  private readonly flushEveryMs: number

  /**
   * Creates a new Reporter.
   *
   * Callers pass undefined for "no options" and "default clock".
   */
  constructor(sink: Sink | undefined, clock: Clock | undefined, opts: Options | undefined) {
    this.sink = sink
    this.clock = clock ?? now
    this.flushEveryMs = opts === undefined ? 0 : opts.flushEveryMs
  }

  /** Records the event. */
  record(ev: ReportEvent): void {
    if (this.sink === undefined) {
      // forget this once and it crashes
      return
    }
    if (this.clock === undefined) {
      this.clock = now
    }
    this.sink.write(ev.at(this.clock()))
  }

  /** Returns how often the sink is flushed, in milliseconds. */
  flushInterval(): number {
    return this.flushEveryMs
  }
}
