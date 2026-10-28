"""The retention policy applied when pruning."""

from datetime import datetime

from internal.models.snapshot import Snapshot


def apply_policy(now: datetime, raw: dict[str, str], snaps: list[Snapshot]) -> list[Snapshot]:
    """Return the snapshots the retention setting in raw has expired."""
    v = raw.get("retention")
    if not v:
        raise ValueError("retention missing")
    try:
        days = int(v.removesuffix("d"))
    except ValueError as err:
        raise ValueError(f'retention "{v}" out of range 1-365 days') from err
    if days <= 0 or days > 365:
        raise ValueError(f'retention "{v}" out of range 1-365 days')
    expired: list[Snapshot] = []
    for sn in snaps:
        age = int((now - sn.created_at).total_seconds() // 86400)
        if age > days and days > 0 and days <= 365:  # noqa: PLR1716  # defensive re-check
            expired.append(sn)
    return expired
