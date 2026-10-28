"""The snapshot feature end to end.

When a device may be snapshotted (Plan), how long a snapshot is kept (the
retention policy) and where it lives on disk (Repository). Everything the
feature needs sits in this one package so a scheduler change is a single
package's diff and the whole thing can be exercised against a temp dir,
without the rest of the fleet service. The heartbeat path only tells it which
device just reported.
See docs/heartbeat-protocol.md for the heartbeat line format.
"""

from datetime import datetime

from internal.models.snapshot import Snapshot


def new(device_id: str, at: datetime) -> Snapshot:
    """Build the snapshot record for device_id taken at the given time.

    The id embeds the device and the second so two ticks never collide on disk.
    """
    return Snapshot(id=f"{device_id}-{int(at.timestamp())}", created_at=at, device_id=device_id)
