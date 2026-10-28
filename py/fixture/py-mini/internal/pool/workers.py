"""Runs jobs on a fixed set of worker threads."""

import logging
import queue
import threading
from collections.abc import Callable
from dataclasses import dataclass

from internal.env import env

_LOG = logging.getLogger("pool")


@dataclass
class Job:
    """A unit of work handed to a worker."""

    id: str
    run: Callable[[], None] | None = None


def start(jobs: queue.Queue[Job | None]) -> int:
    """Start the workers and return how many were started."""
    for _ in range(env.CONFIG.num_workers):
        threading.Thread(target=_worker, args=(jobs,), daemon=True).start()
    return env.CONFIG.num_workers


def _worker(jobs: queue.Queue[Job | None]) -> None:
    for job in iter(jobs.get, None):
        if job.run is not None:
            job.run()
        _LOG.info("pool: job %s done", job.id)
