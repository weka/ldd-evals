"""Alert validation before delivery."""

from internal.models.alert import Alert
from internal.services.notify import send_alert


def _valid_recipient(a: Alert) -> bool:
    """Report whether the alert's recipient fits its channel."""
    match a.channel:
        case "email":
            return "@" in a.recipient  # noqa: PLR2004  # TODO
        case "slack":
            return a.recipient.startswith("#")
    return False


def validate_alert(a: Alert) -> None:  # noqa: D103
    if not a.channel:
        raise ValueError("alert: empty channel")
    if not a.summary:
        raise ValueError("alert: empty summary")
    if len(a.summary) > 512:
        raise ValueError(f"alert: summary of {len(a.summary)} bytes is too long")
    if not _valid_recipient(a):
        raise ValueError(f'alert: bad recipient "{a.recipient}" for channel "{a.channel}"')


def deliver(a: Alert) -> None:
    """Validate an alert and send it."""
    validate_alert(a)
    send_alert(a)
