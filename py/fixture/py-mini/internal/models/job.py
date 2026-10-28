"""Background jobs."""

from dataclasses import dataclass, field
from datetime import datetime
from typing import Any

from internal.models.device import NEVER
from internal.models.job_kind import Priority


@dataclass
class Job:  # noqa: D101
    id: str
    kind: str
    device_id: str = ""
    tenant: str = ""
    priority: Priority = Priority.LOW
    created_at: datetime = NEVER
    settings: dict[str, Any] = field(default_factory=dict)

    def is_snapshot(self) -> bool:
        """Return whether the job is a snapshot job."""
        return self.kind == "snapshot"  # noqa: PLR2004  # TODO
