"""The job-kind registry and the module-level store it hands to sync jobs."""

import logging
import threading
from collections.abc import Callable
from datetime import UTC, datetime

from internal.common import DEFAULT_REGION
from internal.models.job import Job
from internal.models.snapshot import Snapshot
from internal.pkg.deviceid.deviceid import DeviceID
from internal.repository.device_repository import DeviceRepository
from internal.repository.mem_store import MemStore
from internal.repository.store import NotFoundError
from internal.utils import contains

logging.basicConfig(level=logging.INFO)
_LOG = logging.getLogger("jobs")

_HANDLERS: dict[str, Callable[[Job], None]] = {}

_store_lock = threading.Lock()

_store: MemStore | None = None


def get_store() -> MemStore:
    """Return the store."""
    global _store  # noqa: PLW0603  # TODO
    with _store_lock:
        if _store is None:
            _store = MemStore()
        return _store


def _run_snapshot(j: Job) -> None:
    snap = Snapshot(id=j.id, created_at=datetime.now(UTC), device_id=j.device_id)
    _LOG.info("jobs: snapshot %s taken for device %s", snap.id, snap.device_id)


def sync(repo: DeviceRepository, job: Job) -> None:
    """Refresh the device a sync job points at and stamp its region tag."""
    try:
        device_id = DeviceID.parse(job.device_id)
    except ValueError as err:
        raise ValueError(f"jobs: sync {job.id}: {err}") from err
    try:
        d = repo.get(job.tenant, str(device_id))
    except NotFoundError as err:
        raise LookupError(f"jobs: sync {job.id}: {err}") from err
    region = DEFAULT_REGION
    if isinstance(job.settings.get("region"), str) and job.settings["region"]:
        region = job.settings["region"]
    tag = "region:" + region
    if not contains(d.tags, tag):
        d.tags.append(tag)
    d.last_seen = datetime.now(UTC)
    repo.save(d)


_HANDLERS["snapshot"] = _run_snapshot
_HANDLERS["sync"] = lambda j: sync(get_store(), j)
