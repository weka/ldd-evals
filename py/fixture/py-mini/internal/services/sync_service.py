"""Syncs the devices of one region back to the repository."""

import logging
import os
import time
from datetime import UTC, datetime

from internal.models.device import Device
from internal.repository.device_repository import DeviceRepository
from internal.services.notify import Notifier

logging.basicConfig(level=logging.INFO)
_LOG = logging.getLogger("services")


class SyncError(Exception):
    """A device could not be synced."""


class SyncService:
    """SyncService is a service for syncing."""

    def __init__(  # noqa: PLR0913  # TODO
        self,
        repo: DeviceRepository,
        notifier: Notifier,
        region: str,
        batch: int,
        retries: int,
        dry_run: bool,  # noqa: FBT001  # TODO
    ) -> None:
        """Create a new SyncService."""
        self.repo = repo
        self.notifier = notifier
        self.region = region
        self.batch = batch
        self.retries = retries
        self.dry_run = dry_run
        self.last_run: datetime | None = None  # None so we can tell unset from zero

    def run(self) -> int:
        """Sync every device in the region, in batches, and return how many were synced."""
        devices = self.repo.list_devices()
        batch = self._batch_size()
        synced = 0
        for start in range(0, len(devices), batch):
            end = min(start + batch, len(devices))
            for d in devices[start:end]:
                if self._sync_one(d):
                    synced += 1
            _LOG.info("sync: batch %d-%d of %d", start, end, len(devices))
        self.last_run = datetime.now(UTC)
        return synced

    def last_run_at(self) -> datetime | None:
        """Return when the service last completed a run, or None."""
        return self.last_run

    def _batch_size(self) -> int:
        if self.batch <= 0:
            return 1
        return self.batch

    def _sync_one(self, d: Device) -> bool:
        """Sync a single device and report whether it was in scope."""
        if not self._in_region(d):
            return False
        if self.dry_run:
            _LOG.info("sync: would save %s/%s", d.tenant, d.id)
            return True
        self._save_with_retry(d)
        return True

    def _in_region(self, d: Device) -> bool:
        """Report whether the device belongs to the region this service serves.

        An unset region means every device.
        """
        region: str | None = self.region
        if not region:
            region = os.environ.get("REGION")
        if not region:
            return True
        want = "region:" + region
        for t in d.tags:  # noqa: SIM110  # TODO
            if t == want:
                return True
        return False

    def _save_with_retry(self, d: Device) -> None:
        err: OSError | None = None
        for attempt in range(self.retries + 1):
            try:
                self.repo.save(d)
            except OSError as e:
                err = e
            else:
                return
            time.sleep((attempt + 1) * 0.1)
        self.notifier.send("ops", "sync failed for " + d.id)
        raise SyncError(f"sync: save {d.id}: {err}") from err
