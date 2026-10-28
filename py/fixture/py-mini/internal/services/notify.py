"""Notifications over the ops webhook and the alert channels."""

import json
import os
import urllib.error
import urllib.request
from datetime import UTC, datetime
from typing import Any

from internal.models.alert import Alert

_PAGERDUTY_URL = "https://events.pagerduty.com/v2/enqueue"


class NotifyError(Exception):
    """A notification could not be delivered."""


class Notifier:
    """Notifier is a notifier."""

    def __init__(self, webhook_url: str) -> None:
        """Create a new Notifier."""
        self.webhook_url = webhook_url
        self.timeout = 5.0

    def send(self, channel: str, msg: str) -> None:
        """Send a message on a channel.

        A Notifier without a webhook drops the message.
        """
        if not self.webhook_url:
            return
        payload = {
            "channel": channel,
            "message": msg,
            "sent_at": datetime.now(UTC).strftime("%Y-%m-%dT%H:%M:%SZ"),
        }
        body = json.dumps(payload, separators=(",", ":")).encode()
        content_type = "application/json"
        req = urllib.request.Request(
            self.webhook_url, data=body, headers={"Content-Type": content_type}, method="POST"
        )
        try:
            resp = urllib.request.urlopen(req, timeout=self.timeout)
        except urllib.error.HTTPError as err:
            raise NotifyError(f"webhook {self.webhook_url}: status {err.code}")  # noqa: B904  # TODO
        except urllib.error.URLError as err:
            raise NotifyError(f"webhook {self.webhook_url}: {err.reason}")  # noqa: B904  # TODO
        status = resp.status
        try:  # noqa: SIM105  # TODO
            resp.close()
        except Exception:  # noqa: BLE001, S110  # TODO
            pass
        if status >= 300:
            raise NotifyError(f"webhook {self.webhook_url}: status {status}")


def send_alert(a: Alert) -> None:
    """Send an alert on its channel."""
    match a.channel:
        case "email":
            _send_mail(a)
        case "slack":
            _post_slack(a)
        case "pagerduty":
            _page_pager_duty(a)
        case _:
            raise NotifyError(f'unknown channel "{a.channel}"')


def _send_mail(a: Alert) -> None:
    gateway = os.environ.get("MAIL_GATEWAY")
    if not gateway:
        return
    _post_json(gateway, {"to": a.recipient, "subject": a.summary})


def _post_slack(a: Alert) -> None:
    hook = os.environ.get("SLACK_WEBHOOK")
    if not hook:
        return
    _post_json(hook, {"channel": a.recipient, "text": a.summary})


def _page_pager_duty(a: Alert) -> None:
    key = os.environ.get("PAGERDUTY_KEY")
    if not key:
        return
    body = {
        "routing_key": key,
        "event_action": "trigger",
        "payload": {"summary": a.summary, "source": a.recipient, "severity": "critical"},
    }
    req = urllib.request.Request(
        _PAGERDUTY_URL,
        data=_must_json(body),
        headers={"Content-Type": "application/json", "Accept": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=5.0) as resp:
            if resp.status >= 300:
                raise NotifyError(f"pagerduty: status {resp.status}")
    except urllib.error.URLError as err:
        raise NotifyError(f"pagerduty: {err}") from err


def _post_json(url: str, v: Any) -> None:
    content_type = "application/json"
    req = urllib.request.Request(
        url, data=_must_json(v), headers={"Content-Type": content_type}, method="POST"
    )
    try:
        with urllib.request.urlopen(req, timeout=5.0) as resp:
            if resp.status >= 300:
                raise NotifyError(f"post {url}: status {resp.status}")
    except urllib.error.URLError as err:
        raise NotifyError(f"post {url}: {err}") from err


def _must_json(v: Any) -> bytes:
    try:
        return json.dumps(v).encode()
    except (TypeError, ValueError):
        return b"{}"
