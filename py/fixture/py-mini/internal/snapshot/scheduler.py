"""Decides when a device is snapshotted and when its old snapshots go away."""

from collections.abc import Callable
from datetime import datetime

from internal.models.snapshot import Snapshot
from internal.snapshot.config import retention_days
from internal.snapshot.policy import apply_policy
from internal.snapshot.repository import Repository
from internal.snapshot.schedule import Plan
from internal.snapshot.snapshot import new


class Scheduler:
    """Decides when a device is snapshotted and when its old snapshots go away."""

    def __init__(self, store: Repository, plan: Plan, now: Callable[[], datetime] | None) -> None:
        """Build a scheduler over store that honors plan and reads the current time from now."""
        if now is None:
            raise ValueError("scheduler: no clock")
        self.now = now
        self.store = store
        self.plan = plan

    def take(self, raw: dict[str, str], device_id: str) -> Snapshot:
        """Record a new snapshot for device_id.

        The plan must be open and the retention config usable.
        """
        now = self.now()
        if not self.plan.open(now):
            raise ValueError(f"scheduler: plan closed at {now:%H:%M}")
        if retention_days(raw) == 0:
            raise ValueError("scheduler: retention unset, snapshots would never expire")
        sn = new(device_id, now)
        self.store.put(sn)
        return sn

    def prune(self, raw: dict[str, str], device_id: str) -> list[Snapshot]:
        """Delete the snapshots of device_id that the retention policy in raw has expired.

        Returns the deleted records.
        """
        snaps = self.store.list_for(device_id)
        expired = apply_policy(self.now(), raw, snaps)
        for sn in expired:
            self.store.delete(sn.id)
        return expired
