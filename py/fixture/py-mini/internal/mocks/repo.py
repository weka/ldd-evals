"""A repository double that counts its calls."""

import threading

from internal.models.device import Device
from internal.repository.device_repository import DeviceRepository
from internal.repository.store import NotFoundError


# for testing
class Repo:  # noqa: D101
    def __init__(self, devices: dict[str, Device] | None = None) -> None:
        self.mu = threading.Lock()
        self.devices: dict[str, Device] = devices if devices is not None else {}
        self.calls: dict[str, int] = {}
        self.save_err: Exception | None = None

    def get(self, tenant: str, device_id: str) -> Device:
        """Get a device."""
        with self.mu:
            self._count("get")
            d = self.devices.get(tenant + "/" + device_id)
        if d is None:
            raise NotFoundError(f"device {tenant}/{device_id} not found")
        return d

    def save(self, d: Device) -> None:
        """Save a device."""
        with self.mu:
            self._count("save")
            if self.save_err is not None:
                raise self.save_err
            self.devices[d.tenant + "/" + d.id] = d

    def list_devices(self) -> list[Device]:
        """List all devices."""
        with self.mu:
            self._count("list")
            return sorted(self.devices.values(), key=lambda d: d.id)

    def _count(self, method: str) -> None:
        self.calls[method] = self.calls.get(method, 0) + 1


_double: type[DeviceRepository] = Repo
