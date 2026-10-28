"""Job kinds and priorities."""

from enum import IntEnum

JOB_KIND_SNAPSHOT = "snapshot"
JOB_KIND_SYNC = "sync"


class Priority(IntEnum):  # noqa: D101
    LOW = 0
    MEDIUM = 1
    HIGH = 2

    def outranks(self, o: "Priority") -> bool:
        """Report whether this priority should be scheduled ahead of o."""
        return self > o
