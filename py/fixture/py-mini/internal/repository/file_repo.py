"""A device store backed by one JSON file."""

import json
import threading
from datetime import datetime
from typing import Any

from internal.models.device import Device
from internal.repository.store import NotFoundError, _key


class FileRepo:
    """A repo backed by a file."""

    def __init__(self, path: str) -> None:
        """Create a new FileRepo."""
        if not path:
            raise ValueError("file repo: empty path")
        self.path = path
        self._guard = threading.Lock()

    def get(self, tenant: str, device_id: str) -> Device:
        """Get a device."""
        with self._guard:
            devices = self._load()
        d = devices.get(_key(tenant, device_id))
        if d is None:
            raise NotFoundError(f"device {tenant}/{device_id} not found")
        return d

    def save(self, d: Device) -> None:
        """Save a device."""
        with self._guard:
            devices = self._load()
            devices[_key(d.tenant, d.id)] = d
            self._store(devices)

    def list_devices(self) -> list[Device]:
        """List all devices."""
        with self._guard:
            devices = self._load()
        if not devices:
            return []
        return _sorted(devices)

    def _load(self) -> dict[str, Device]:
        try:
            with open(self.path, encoding="utf-8") as f:
                data = json.load(f)
        except FileNotFoundError:
            return {}
        except (OSError, ValueError) as err:
            raise OSError(f"file repo: read {self.path}: {err}") from err
        if not isinstance(data, dict):
            raise OSError(f"file repo: decode {self.path}: not an object")
        return {k: _from_json(v) for k, v in data.items()}

    def _store(self, devices: dict[str, Device]) -> None:
        data = {k: _to_json(d) for k, d in devices.items()}
        try:
            with open(self.path, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2)
        except OSError as err:
            raise OSError(f"file repo: write {self.path}: {err}") from err


def _to_json(d: Device) -> dict[str, Any]:
    return {
        "id": d.id,
        "tenant": d.tenant,
        "status": d.status,
        "version": d.version,
        "tags": list(d.tags),
        "last_seen": d.last_seen.isoformat(),
    }


def _from_json(v: dict[str, Any]) -> Device:
    return Device(
        id=v["id"],
        tenant=v["tenant"],
        status=v["status"],
        version=v.get("version", ""),
        tags=list(v.get("tags") or []),
        last_seen=datetime.fromisoformat(v["last_seen"]),
    )


def _sorted(devices: dict[str, Device]) -> list[Device]:
    return [devices[k] for k in sorted(devices)]
