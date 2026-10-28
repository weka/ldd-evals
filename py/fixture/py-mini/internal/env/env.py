"""Loads process configuration from environment variables."""

import os
from dataclasses import dataclass


@dataclass
class Configuration:
    """Configuration is the configuration."""

    num_workers: int = 4
    batch_size: int = 64
    flap_window_sec: int = 30
    queue_addr: str = ""
    region: str = "us"


CONFIG = Configuration()

_region = os.environ.get("REGION")


def load() -> None:
    """Load the configuration."""
    global CONFIG  # noqa: PLW0603  # loaded in main, read everywhere
    CONFIG = Configuration(
        num_workers=_int_env("NUM_WORKERS", 4),
        batch_size=_int_env("BATCH", 64),
        flap_window_sec=_int_env("FLAP_WINDOW_SEC", 30),
        queue_addr=os.environ.get("QUEUE_ADDR", ""),
        region=_region_or_default(),
    )


def _region_or_default() -> str:
    if not _region:
        return "us"
    return _region


def _int_env(key: str, default: int) -> int:
    v = os.environ.get(key)
    if not v:
        return default
    try:
        return int(v)
    except ValueError:
        return default
