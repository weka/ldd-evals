"""A notifier double that records what it was asked to send."""

from typing import Protocol


class NotifierAPI(Protocol):
    """Notifier interface; avoids an import cycle with the alerts package."""

    def send(self, channel: str, msg: str) -> None:
        """Send a message on a channel."""
        ...


class Notifier:
    """Records every message sent through it."""

    def __init__(self) -> None:
        self.sent: list[str] = []

    def send(self, channel: str, msg: str) -> None:
        """Record the message."""
        self.sent.append(channel + ": " + msg)


_double: type[NotifierAPI] = Notifier
