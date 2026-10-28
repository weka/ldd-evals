"""Tenants: the owners of device fleets."""

from dataclasses import dataclass
from typing import Self

_MAX_TENANT_LEN = 32
_TENANT_CHARS = frozenset("abcdefghijklmnopqrstuvwxyz0123456789-")


@dataclass(frozen=True)
class Tenant:
    """Identifies the owner of a device fleet.

    Every Tenant is validated as it is built, so a value in circulation is
    already non-empty, lowercase, and at most 32 characters long; nothing
    downstream needs to check it again. Tenant.parse is the boundary spelling.
    """

    _id: str

    def __post_init__(self) -> None:
        raw = self._id
        if not raw:
            raise ValueError("tenant: empty")
        if len(raw) > _MAX_TENANT_LEN:
            raise ValueError(f'tenant "{raw}": longer than {_MAX_TENANT_LEN} characters')
        for r in raw:
            if not _is_tenant_char(r):
                raise ValueError(f"tenant \"{raw}\": want lowercase letters, digits, or '-'")

    @classmethod
    def parse(cls, raw: str) -> Self:
        """Validate a raw tenant identifier once, at the boundary."""
        return cls(raw)

    @property
    def id(self) -> str:
        """Return the validated identifier for use in storage keys and logs."""
        return self._id


def _is_tenant_char(r: str) -> bool:
    return r in _TENANT_CHARS
