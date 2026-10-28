"""The repository the services depend on."""

from typing import Protocol

from internal.models.device import Device
from internal.repository.file_repo import FileRepo


class DeviceRepository(Protocol):
    """The store as the services see it; avoids an import cycle with the services package."""

    def get(self, tenant: str, device_id: str) -> Device:
        """Return the device, or raise NotFoundError."""
        ...

    def save(self, d: Device) -> None:
        """Store the device."""
        ...

    def list_devices(self) -> list[Device]:
        """Return every device."""
        ...


_implementers: tuple[type[DeviceRepository], ...] = (FileRepo,)
