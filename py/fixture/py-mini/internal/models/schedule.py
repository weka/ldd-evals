"""Weekly schedules."""

# A weekday as datetime.weekday() reports it: 0 is Monday, 6 is Sunday.
Weekday = int


class Schedule:
    """Schedule is a schedule."""

    def __init__(self, days: list[Weekday]) -> None:
        if not days:
            raise ValueError("schedule: no days")
        for d in days:
            if d < 0 or d > 6:
                raise ValueError(f"schedule: bad weekday {d}")
        self._days = days

    def days(self) -> list[Weekday]:
        """Return the days."""
        return self._days

    def includes(self, d: Weekday) -> bool:
        """Return whether the schedule includes the day."""
        return d in self._days
