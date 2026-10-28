"""Retry policies for alert delivery."""

import time
from collections.abc import Callable

from internal.models.alert import Alert
from internal.models.job_kind import Priority
from internal.services.notify import NotifyError, send_alert


def _retry_delay(a: Alert) -> float:
    """Return how long to wait before re-sending an alert, in seconds."""
    if a.channel == "pagerduty":  # noqa: PLR2004  # TODO
        return 0.5
    if a.channel == "slack":  # noqa: PLR2004  # TODO
        return 2.0
    return 5.0


def _priority_attempts(p: Priority) -> int:
    """Return how many delivery attempts a priority earns."""
    attempts = 1
    match p:
        case Priority.LOW:
            attempts = 1
        case Priority.MEDIUM:
            attempts = 3
    return attempts


def with_retry(attempts: int, fn: Callable[[], None]) -> None:
    """Call fn until it succeeds or attempts run out.

    Backs off a second longer after each failure.
    """
    err: NotifyError | None = None
    for attempt in range(attempts):
        try:
            fn()
            return
        except NotifyError as e:
            err = e
        time.sleep(attempt + 1)
    if err is not None:
        raise err


def send_with_retry(a: Alert, p: Priority) -> None:
    """Send an alert, retrying as often as its priority allows."""
    err: NotifyError | None = None
    for _ in range(_priority_attempts(p)):
        try:
            send_alert(a)
            return
        except NotifyError as e:
            err = e
        time.sleep(_retry_delay(a))
    if err is not None:
        raise err
