"""Device status values as they travel on the wire."""

STATUSES = ("READY", "DEGRADED", "DOWN", "BOOTING")
STATUS_READY, STATUS_DEGRADED, STATUS_DOWN, STATUS_BOOTING = STATUSES


def is_valid_status(s: str) -> bool:
    """Check whether the status is valid."""
    return s in STATUSES
