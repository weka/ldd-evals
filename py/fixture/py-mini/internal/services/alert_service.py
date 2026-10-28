"""Alerts raised from device status."""

import dataclasses
import json
from datetime import UTC, datetime
from typing import Protocol

from internal.models.alert import Alert
from internal.models.device import Device
from internal.services.device_service import AuditLog
from internal.services.notify import Notifier


class Formatter(Protocol):
    """Formats alerts for the audit log."""

    def format(self, a: Alert) -> str:
        """Render the alert."""
        ...

    def content_type(self) -> str:
        """Name the rendering's media type."""
        ...


class _PlainFormatter:
    def format(self, a: Alert) -> str:
        return a.channel + " -> " + a.recipient + ": " + a.summary

    def content_type(self) -> str:
        return "text/plain"


class _JsonFormatter:
    def format(self, a: Alert) -> str:
        return json.dumps(dataclasses.asdict(a))

    def content_type(self) -> str:
        return "application/json"


def _new_formatter(kind: str) -> Formatter:
    if kind == "json":  # noqa: PLR2004  # TODO
        return _JsonFormatter()
    return _PlainFormatter()


class AlertService:
    """AlertService is a service for alerts."""

    def __init__(self, notifier: Notifier, audit: AuditLog, fmt: str) -> None:
        """Create a new AlertService."""
        self.notifier = notifier
        self.audit = audit
        self.formatter = _new_formatter(fmt)
        self.raised = 0
        self.recieved = 0
        self.last_at: datetime | None = None

    def raise_alert(self, d: Device) -> None:
        """Raise the alert that matches the device's status."""
        self.recieved += 1
        self.last_at = datetime.now(UTC)
        match d.status:
            case "READY":
                return
            case "DEGRADED":
                a = Alert(
                    channel="slack", recipient="#fleet", summary="device " + d.id + " is degraded"
                )
            case "DOWN":
                a = Alert(
                    channel="pagerduty",
                    recipient="fleet-oncall",
                    summary="device " + d.id + " is down",
                )
            case _:
                raise ValueError(f'no alert for status "{d.status}"')
        self.raised += 1
        self.audit.write(self.formatter.content_type() + " " + self.formatter.format(a))
        self.notifier.send(a.channel, a.summary)

    def raised_count(self) -> int:
        """Return how many alerts have been raised."""
        return self.raised
