"""Heartbeats as devices send them."""

from dataclasses import dataclass
from datetime import datetime


@dataclass
class Heartbeat:
    """Heartbeat is a heartbeat.

    See docs/snapshots.md for the snapshot format.
    """

    device_id: str
    tenant: str
    status: str
    version: str
    tags: list[str]
    received_at: datetime
    # caller must ensure the line is validated
    raw: str

    def line(self) -> str:
        """Return the line."""
        return self.raw
