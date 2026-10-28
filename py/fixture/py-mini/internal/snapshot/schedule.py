"""Daily windows during which snapshots may be taken."""

import time
from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Self

_MINUTES_PER_DAY = 24 * 60


@dataclass(frozen=True)
class Window:
    """A daily time-of-day interval during which snapshots may be taken.

    A window that ends before it starts wraps past midnight. Both ends are
    minutes since midnight and are checked as the Window is built, so a
    Window in circulation is never empty and never points outside the day.
    """

    start: int  # minutes since midnight
    end: int  # minutes since midnight

    def __post_init__(self) -> None:
        for name, minutes in (("start", self.start), ("end", self.end)):
            if not 0 <= minutes < _MINUTES_PER_DAY:
                raise ValueError(f"window {name}: {minutes} minutes is outside the day")
        if self.start == self.end:
            raise ValueError(f"window {self} is empty")

    @classmethod
    def parse(cls, start: str, end: str) -> Self:
        """Build a Window from two "HH:MM" clock times."""
        try:
            s = _parse_clock(start)
        except ValueError as err:
            raise ValueError(f"window start: {err}") from err
        try:
            e = _parse_clock(end)
        except ValueError as err:
            raise ValueError(f"window end: {err}") from err
        return cls(start=s, end=e)

    def contains(self, t: datetime) -> bool:
        """Report whether t falls inside the window."""
        m = t.hour * 60 + t.minute
        if self.start < self.end:
            return self.start <= m < self.end
        return m >= self.start or m < self.end

    def duration(self) -> timedelta:
        """Return how long the window stays open each day."""
        span = self.end - self.start
        if span < 0:
            span += _MINUTES_PER_DAY
        return timedelta(minutes=span)

    def __str__(self) -> str:
        return (
            f"{self.start // 60:02d}:{self.start % 60:02d}-{self.end // 60:02d}:{self.end % 60:02d}"
        )


def _parse_clock(v: str) -> int:
    try:
        t = time.strptime(v, "%H:%M")
    except ValueError:
        raise ValueError(f'clock time "{v}": want HH:MM') from None
    return t.tm_hour * 60 + t.tm_min


class Plan:
    """The set of windows during which a device may be snapshotted."""

    def __init__(self, windows: list[Window]) -> None:
        """Build a Plan from at least one window.

        The plan keeps its own copy so later changes to the caller's list
        cannot reorder or shrink it.
        """
        if not windows:
            raise ValueError("plan: no windows")
        self._windows = list(windows)

    def open(self, t: datetime) -> bool:
        """Report whether any window of the plan contains t."""
        return any(w.contains(t) for w in self._windows)

    def windows(self) -> list[Window]:
        """Return the plan's windows.

        Callers get their own copy: the plan is shared by the scheduler and
        the status page, and neither may edit it.
        """
        return list(self._windows)
