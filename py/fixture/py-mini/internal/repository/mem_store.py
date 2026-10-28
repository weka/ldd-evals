"""An in-memory device store."""

import threading

from internal.models.device import Device
from internal.repository.store import NotFoundError, _key


class MemStore:
    """Keeps the fleet in memory.

    It is the store behind `svc --dry-run`, where an operator replays
    recorded heartbeats without writing anything to disk.
    """

    def __init__(self) -> None:
        """Create a new MemStore."""
        self._guard = threading.Lock()
        self._devices: dict[str, Device] = {}

    def get(self, tenant: str, device_id: str) -> Device:
        """Get a device."""
        with self._guard:
            d = self._devices.get(_key(tenant, device_id))
        if d is None:
            raise NotFoundError(f"device {tenant}/{device_id} not found")
        return d

    def save(self, d: Device) -> None:
        """Save a device."""
        with self._guard:
            self._devices[_key(d.tenant, d.id)] = d

    def list_devices(self) -> list[Device]:
        """List all devices."""
        with self._guard:
            devices = dict(self._devices)
        if not devices:
            return []
        return [devices[k] for k in sorted(devices)]
