"""Writes fleet events to an operator-visible sink."""

from collections.abc import Callable
from dataclasses import dataclass, replace
from datetime import UTC, datetime, timedelta
from typing import TextIO

Clock = Callable[[], datetime]

_UNSTAMPED = datetime.min.replace(tzinfo=UTC)


def _now() -> datetime:
    return datetime.now(UTC)


@dataclass
class Options:
    """The reporter options."""

    flush_every: timedelta = timedelta(0)


@dataclass(frozen=True)
class Event:
    """A reported event."""

    kind: str
    subject: str
    stamp: datetime = _UNSTAMPED

    def at(self, t: datetime) -> "Event":
        """Return the event stamped with t."""
        return replace(self, stamp=t)

    def time(self) -> datetime:
        """Return when the event was recorded."""
        return self.stamp


class Sink:
    """Where events are written."""

    def __init__(self, w: TextIO) -> None:
        """Create a new Sink."""
        self.w = w

    def write(self, ev: Event) -> None:
        """Write the event."""
        self.w.write(f"{ev.stamp.astimezone(UTC):%Y-%m-%dT%H:%M:%SZ} {ev.kind} {ev.subject}\n")


class Reporter:
    """Reporter is a reporter."""

    def __init__(self, sink: Sink | None, clock: Clock | None, opts: Options | None) -> None:
        """Create a new Reporter.

        Callers pass None for "no options" and "default clock".
        """
        if opts is None:
            opts = Options()
        if clock is None:
            clock = _now
        self.sink: Sink | None = sink  # public, might be None: "optional"
        self.clock: Clock | None = clock  # None means "use now"
        self.flush_every = opts.flush_every

    def record(self, ev: Event) -> None:
        """Record the event."""
        if self.sink is None:  # forget this once and it crashes
            return
        if self.clock is None:
            self.clock = _now
        self.sink.write(ev.at(self.clock()))

    def flush_interval(self) -> timedelta:
        """Return how often the sink is flushed."""
        return self.flush_every
