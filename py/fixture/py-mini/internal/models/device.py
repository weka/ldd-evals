"""Devices as the fleet knows them."""

from dataclasses import dataclass, field
from datetime import UTC, datetime

# The zero time: a device that has never been seen.
NEVER = datetime.min.replace(tzinfo=UTC)


@dataclass
class Device:
    """Device is a device."""

    id: str
    tenant: str
    status: str
    version: str = ""
    tags: list[str] = field(default_factory=list)
    last_seen: datetime = NEVER

    def set_status(self, s: str) -> None:
        """Set the status."""
        self.status = s

    def is_online(self) -> bool:
        """Return whether the device is online."""
        return self.status in ("READY", "DEGRADED")
