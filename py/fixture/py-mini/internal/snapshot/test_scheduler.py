from datetime import UTC, datetime, timedelta
from pathlib import Path

import pytest

from internal.snapshot.repository import Repository
from internal.snapshot.schedule import Plan, Window
from internal.snapshot.scheduler import Scheduler
from internal.snapshot.snapshot import new


def _policy(retention: str) -> dict[str, str]:
    return {"retention": retention}


def _scheduler(tmp_path: Path, now: datetime) -> tuple[Scheduler, Repository]:
    store = Repository(str(tmp_path / "snaps"))
    plan = Plan([Window.parse("00:00", "23:59")])
    return Scheduler(store, plan, lambda: now), store


def _stored_ids(store: Repository, device_id: str) -> list[str]:
    return [sn.id for sn in store.list_for(device_id)]


def test_scheduler_prune_deletes_expired_snapshots(tmp_path: Path) -> None:
    now = datetime(2024, 3, 1, 12, tzinfo=UTC)
    sched, store = _scheduler(tmp_path, now)
    old = new("dev-1", now - timedelta(days=40))
    fresh = new("dev-1", now - timedelta(days=2))
    other = new("dev-2", now - timedelta(days=40))
    for sn in (old, fresh, other):
        store.put(sn)

    expired = sched.prune(_policy("30d"), "dev-1")

    assert [sn.id for sn in expired] == [old.id]
    assert _stored_ids(store, "dev-1") == [fresh.id]
    assert _stored_ids(store, "dev-2") == [other.id]


def test_scheduler_prune_keeps_everything_inside_retention(tmp_path: Path) -> None:
    now = datetime(2024, 3, 1, 12, tzinfo=UTC)
    sched, store = _scheduler(tmp_path, now)
    store.put(new("dev-1", now - timedelta(days=6)))

    assert sched.prune(_policy("7d"), "dev-1") == []


def test_scheduler_take_records_snapshot(tmp_path: Path) -> None:
    now = datetime(2024, 3, 1, 12, tzinfo=UTC)
    sched, store = _scheduler(tmp_path, now)

    sn = sched.take(_policy("30d"), "dev-1")

    assert (sn.device_id, sn.created_at) == ("dev-1", now)
    assert _stored_ids(store, "dev-1") == [sn.id]


def test_scheduler_rejects_missing_clock(tmp_path: Path) -> None:
    store = Repository(str(tmp_path / "snaps"))
    with pytest.raises(ValueError, match="clock"):
        Scheduler(store, Plan([Window.parse("00:00", "23:59")]), None)
