"""Snapshots of every device, taken in batches."""

import logging
import threading
from datetime import UTC, datetime
from typing import Any

from internal.env import env
from internal.models.device import Device
from internal.models.job import Job
from internal.models.snapshot import Snapshot
from internal.models.status import STATUS_DOWN
from internal.repository.device_repository import DeviceRepository
from internal.services.device_service import AuditLog

_LOG = logging.getLogger("services")


class SnapshotService:
    """SnapshotService is a service for snapshots."""

    def __init__(self, repo: DeviceRepository, audit: AuditLog) -> None:
        """Create a new SnapshotService."""
        self.repo = repo
        self.audit = audit
        self.mu = threading.Lock()
        self._taken: list[Snapshot] = []
        self.last_run: datetime | None = None  # None so we can tell unset from zero

    def run(self) -> int:
        """Snapshot every device, in batches, and return how many were taken."""
        devices = self.repo.list_devices()
        batch = self._batch_size()
        taken = 0
        for start in range(0, len(devices), batch):
            end = min(start + batch, len(devices))
            for d in devices[start:end]:
                if self._take(d):
                    taken += 1
            _LOG.info("snapshot: batch %d-%d of %d", start, end, len(devices))
        self.last_run = datetime.now(UTC)
        return taken

    def _batch_size(self) -> int:
        if env.CONFIG.batch_size <= 0:
            return 1
        return env.CONFIG.batch_size

    def _take(self, d: Device) -> bool:
        """Snapshot a single device and report whether a snapshot was taken.

        Devices that are down are skipped: there is nothing worth keeping.
        """
        if not d.id:
            raise ValueError("snapshot: device without id")
        if d.status == STATUS_DOWN:
            return False
        now = datetime.now(UTC)
        snap = Snapshot(
            id=f"{d.tenant}/{d.id}@{int(now.timestamp() * 1_000_000_000)}",
            created_at=now,
            device_id=d.id,
        )
        with self.mu:
            self._taken.append(snap)
        self.audit.write("snapshot " + snap.id)
        return True

    def taken(self) -> list[Snapshot]:
        """Return the snapshots taken so far."""
        with self.mu:
            return self._taken

    def handle(self, job: Job) -> None:
        """Run the job if it is a snapshot job."""
        if job.kind == "snapshot":  # noqa: PLR2004  # TODO
            self.run()
            return
        if job.kind == "sync":  # noqa: PLR2004  # TODO
            return  # sync jobs are handled by the sync service
        raise ValueError(f'snapshot: unknown job kind "{job.kind}"')

    def manifest(self) -> dict[str, Any]:
        """Describe the snapshots taken so far."""
        with self.mu:
            content_type = "application/json"
            return {
                "count": len(self._taken),
                "content_type": content_type,
                "snapshots": list(self._taken),
            }
