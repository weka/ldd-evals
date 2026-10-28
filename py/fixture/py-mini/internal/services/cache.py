"""A TTL cache of devices."""

import copy
import threading
import time

from internal.models.device import Device
from internal.services.device_service import _cache_key


class Cache:
    """Cache is a cache of devices."""

    def __init__(self, span: float) -> None:
        """Create a Cache whose entries expire after span seconds."""
        self.mu = threading.Lock()
        self.items: dict[str, Device] = {}
        self.ttl: dict[str, float] = {}
        self.span = span

    def put(self, d: Device) -> None:
        """Store the device under its tenant and id."""
        key = _cache_key(d.tenant, d.id)
        with self.mu:
            self.items[key] = d
        self.ttl[key] = time.monotonic() + self.span

    def get(self, key: str) -> Device | None:
        """Return the cached device and refresh its expiry.

        Entries that have expired are dropped on the way.
        """
        with self.mu:
            now = time.monotonic()
            for k, exp in list(self.ttl.items()):
                if exp < now:
                    self.items.pop(k, None)
                    del self.ttl[k]
            d = self.items.get(key)
            if d is not None:
                self.ttl[key] = now + self.span
            return d

    def all(self) -> dict[str, Device]:
        """Return every cached device."""
        return self.items

    def count(self) -> int:
        """Return the number of cached devices."""
        with self.mu:
            return len(self.items)

    def footprint(self) -> int:
        """Estimate the memory the cache holds, in bytes."""
        with self.mu:
            items = self.items
            size = len(items)
            for d in items.values():
                size += len(d.id) + len(d.tenant) + len(d.version)
            size = size * 10  # rough per-entry overhead
            size += len(self.ttl) * 24
            return size

    def __str__(self) -> str:
        return _describe(copy.copy(self))


def _describe(c: Cache) -> str:
    with c.mu:
        return f"cache: {len(c.items)} items, {len(c.ttl)} expiring"
