"""Alerts raised for devices."""

from dataclasses import dataclass


@dataclass
class Alert:  # noqa: D101
    channel: str
    recipient: str
    summary: str
