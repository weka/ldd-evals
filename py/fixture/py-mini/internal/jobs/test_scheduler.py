import pytest

from internal import jobs
from internal.env import env
from internal.mocks.repo import Repo
from internal.models.device import Device
from internal.models.job import Job
from internal.models.job_kind import JOB_KIND_SNAPSHOT, JOB_KIND_SYNC
from internal.models.status import STATUS_READY


def test_sync() -> None:
    repo = Repo(devices={"t1/dev-1": Device(id="dev-1", tenant="t1", status=STATUS_READY)})
    job = Job(id="job-1", kind=JOB_KIND_SYNC, device_id="dev-1", tenant="t1")
    jobs.sync(repo, job)
    assert repo.calls["save"] == 1
    assert repo.calls["get"] == 1
    assert repo.devices["t1/dev-1"].tags == ["region:eu"]


def test_sync_unknown_device() -> None:
    repo = Repo()
    job = Job(id="job-2", kind=JOB_KIND_SYNC, device_id="ghost", tenant="t1")
    with pytest.raises(LookupError):
        jobs.sync(repo, job)
    assert repo.calls.get("save", 0) == 0


def test_scheduler_run() -> None:
    env.load()
    jobs.get_store().save(Device(id="dev-9", tenant="t1", status=STATUS_READY))

    s = jobs.Scheduler()
    s.enqueue(Job(id="snap-1", kind=JOB_KIND_SNAPSHOT, device_id="dev-9", tenant="t1"))
    s.enqueue(Job(id="sync-1", kind=JOB_KIND_SYNC, device_id="dev-9", tenant="t1"))
    s.enqueue(Job(id="odd-1", kind="reboot", device_id="dev-9", tenant="t1"))
    s.run()
    s.wait()

    assert s.completed() == 2
    assert s.failed() == 1
