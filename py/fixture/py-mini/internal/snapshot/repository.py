"""One JSON file per snapshot under a directory."""

import json
import os
from datetime import datetime
from urllib.parse import quote

from internal.models.snapshot import Snapshot


class Repository:
    """Stores one JSON file per snapshot under a directory."""

    def __init__(self, directory: str) -> None:
        """Open the store under directory, creating the directory if needed."""
        if not directory:
            raise ValueError("snapshot repository: empty dir")
        try:
            os.makedirs(directory, exist_ok=True)
        except OSError as err:
            raise OSError(f"snapshot repository: mkdir {directory}: {err}") from err
        self.dir = directory

    def put(self, sn: Snapshot) -> None:
        """Write the snapshot, replacing any earlier record with the same id."""
        data = {"id": sn.id, "created_at": sn.created_at.isoformat(), "device_id": sn.device_id}
        try:
            with open(self._path(sn.id), "w", encoding="utf-8") as f:
                json.dump(data, f)
        except OSError as err:
            raise OSError(f"snapshot repository: write {sn.id}: {err}") from err

    def delete(self, snapshot_id: str) -> None:
        """Remove the snapshot with the given id.

        Deleting an unknown id is not an error: a prune that
        races a manual cleanup should still succeed.
        """
        try:
            os.remove(self._path(snapshot_id))
        except FileNotFoundError:
            return
        except OSError as err:
            raise OSError(f"snapshot repository: delete {snapshot_id}: {err}") from err

    def list_for(self, device_id: str) -> list[Snapshot]:
        """Return the snapshots of device_id, oldest first."""
        try:
            names = os.listdir(self.dir)
        except OSError as err:
            raise OSError(f"snapshot repository: read {self.dir}: {err}") from err
        out: list[Snapshot] = []
        for name in names:
            if not name.endswith(".json"):
                continue
            sn = self._read(name)
            if sn.device_id == device_id:
                out.append(sn)
        out.sort(key=lambda s: s.created_at)
        return out

    def _read(self, name: str) -> Snapshot:
        try:
            with open(os.path.join(self.dir, name), encoding="utf-8") as f:
                data = json.load(f)
        except OSError as err:
            raise OSError(f"snapshot repository: read {name}: {err}") from err
        except ValueError as err:
            raise OSError(f"snapshot repository: decode {name}: {err}") from err
        return Snapshot(
            id=data["id"],
            created_at=datetime.fromisoformat(data["created_at"]),
            device_id=data["device_id"],
        )

    def _path(self, snapshot_id: str) -> str:
        return os.path.join(self.dir, quote(snapshot_id, safe="") + ".json")
