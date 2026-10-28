"""What a running instance is allowed to do."""

from enum import StrEnum


class Permission(StrEnum):
    """One thing an instance may do."""

    READ = "read"
    WRITE = "write"
    ADMIN = "admin"


class Grants:
    """The permissions an instance holds."""

    def __init__(self, perms: list[Permission]) -> None:
        """Create new Grants."""
        self._perms = perms

    def all(self) -> list[Permission]:
        """Return all permissions."""
        return self._perms

    def has(self, p: Permission) -> bool:
        """Return whether the grants have the permission."""
        return p in self._perms


class ReplicaCount(int):
    """Number of replicas."""

    def as_int(self) -> int:
        """Return the count as a plain int."""
        return int(self)


class Name(str):
    """A name."""

    def __str__(self) -> str:
        return str.__str__(self)
