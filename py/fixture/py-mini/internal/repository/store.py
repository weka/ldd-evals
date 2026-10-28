"""The persistence boundary for devices."""

from typing import TYPE_CHECKING, Protocol

from internal.models.device import Device


class NotFoundError(LookupError):
    """Raised when no device matches the tenant and id."""


class Store(Protocol):
    """Where devices are kept.

    Two production stores implement it: FileRepo keeps the fleet in a JSON
    file, and MemStore backs `svc --dry-run` so an operator can replay
    heartbeats without touching disk.
    """

    def get(self, tenant: str, device_id: str) -> Device:
        """Return the device, or raise NotFoundError."""
        ...

    def save(self, d: Device) -> None:
        """Store the device, replacing any earlier record."""
        ...

    def list_devices(self) -> list[Device]:
        """Return every device, ordered by tenant and id."""
        ...


def _key(tenant: str, device_id: str) -> str:
    return tenant + "/" + device_id


if TYPE_CHECKING:
    from internal.repository.file_repo import FileRepo
    from internal.repository.mem_store import MemStore

    _implementers: tuple[type[Store], ...] = (FileRepo, MemStore)
