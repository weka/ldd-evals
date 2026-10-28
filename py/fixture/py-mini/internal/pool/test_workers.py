import queue

from internal.env import env
from internal.pool import workers as pool


def test_start() -> None:
    env.CONFIG.num_workers = 2

    ids = ["job-a", "job-b"]
    done: queue.Queue[str] = queue.Queue()
    jobs: queue.Queue[pool.Job | None] = queue.Queue()
    started = pool.start(jobs)

    for job_id in ids:
        jobs.put(pool.Job(id=job_id, run=lambda job_id=job_id: done.put(job_id)))  # type: ignore[misc]
    for _ in range(started):
        jobs.put(None)

    seen = {done.get(timeout=2) for _ in ids}
    assert seen == set(ids)
