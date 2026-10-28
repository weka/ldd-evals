"""Parsing of the priority devices send on the wire."""

from internal.models.job_kind import Priority


def parse_priority(n: int) -> Priority:
    """Accept the integer devices send on the wire.

    Anything outside the range the scheduler knows how to order is rejected.
    """
    if n < int(Priority.LOW) or n > int(Priority.HIGH):
        raise ValueError(f"priority {n}: want {int(Priority.LOW)}-{int(Priority.HIGH)}")
    return Priority(n)
