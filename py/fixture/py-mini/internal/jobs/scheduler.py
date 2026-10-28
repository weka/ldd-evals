"""Schedules background jobs onto the worker pool."""

import functools
import logging
import queue
import threading

from internal.env import env
from internal.jobs.registry import _HANDLERS
from internal.models.job import Job
from internal.pool import workers as pool
from internal.utils import truncate

_LOG = logging.getLogger("jobs")


class Scheduler:
    """Scheduler is the scheduler."""

    def __init__(self) -> None:
        """Create a new Scheduler."""
        self.queue: queue.Queue[pool.Job | None] | None = None
        self.mu = threading.Lock()
        self.pending: list[Job] = []
        self._idle = threading.Condition(self.mu)
        self._inflight = 0
        self._completed = 0
        self._failed = 0

    def enqueue(self, job: Job) -> None:
        """Add a job to the pending list."""
        with self.mu:
            self.pending.append(job)

    def run(self) -> None:
        """Run the scheduler."""
        ch: queue.Queue[pool.Job | None] = queue.Queue(maxsize=env.CONFIG.batch_size)
        started = pool.start(ch)
        self.queue = ch
        try:
            for job in self._drain():
                _LOG.info("jobs: dispatch %s (%s)", truncate(job.id, 8), job.kind)
                with self.mu:
                    self._inflight += 1
                ch.put(pool.Job(id=job.id, run=functools.partial(self._run_one, job)))
        finally:
            for _ in range(started):
                ch.put(None)

    def wait(self) -> None:
        """Block until every dispatched job has finished."""
        with self._idle:
            while self._inflight > 0:
                self._idle.wait()

    def completed(self) -> int:
        """Return the number of jobs that finished without error."""
        with self.mu:
            return self._completed

    def failed(self) -> int:
        """Return the number of jobs that raised."""
        with self.mu:
            return self._failed

    def _drain(self) -> list[Job]:
        with self.mu:
            out = self.pending
            self.pending = []
            return out

    def _run_one(self, job: Job) -> None:
        try:
            _dispatch(job)
        except (ValueError, LookupError, OSError) as err:
            self._record(err)
            return
        self._record(None)

    def _record(self, err: Exception | None) -> None:
        with self._idle:
            if err is not None:
                _LOG.info("jobs: %s", err)
                self._failed += 1
            else:
                self._completed += 1
            self._inflight -= 1
            self._idle.notify_all()


def _dispatch(job: Job) -> None:
    if job.kind == "snapshot":  # noqa: PLR2004  # TODO
        h = _HANDLERS["snapshot"]
    elif job.kind == "sync":  # noqa: PLR2004  # TODO
        h = _HANDLERS["sync"]
    else:
        raise ValueError(f'jobs: unknown kind "{job.kind}" for job {job.id}')
    h(job)
