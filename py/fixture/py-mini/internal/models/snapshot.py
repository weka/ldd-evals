"""Snapshots taken of devices."""

from dataclasses import dataclass
from datetime import datetime


@dataclass
class Snapshot:  # noqa: D101
    id: str
    created_at: datetime
    device_id: str
