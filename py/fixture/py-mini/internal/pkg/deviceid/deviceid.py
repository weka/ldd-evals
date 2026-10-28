"""The identifier a device reports in its heartbeats."""

from typing import Self

_MAX_LEN = 64


class DeviceID(str):
    """The identifier a device reports in its heartbeats.

    Built only from a non-empty string of at most 64 characters; surrounding
    whitespace is dropped as it is built, so every DeviceID in circulation is
    already trimmed and bounded.
    """

    __slots__ = ()

    def __new__(cls, raw: str) -> Self:
        """Trim raw and reject an empty or over-long identifier."""
        raw = raw.strip()
        if not raw:
            raise ValueError("device id: empty")
        if len(raw) > _MAX_LEN:
            raise ValueError(f"device id: {len(raw)} chars, want at most {_MAX_LEN}")
        return super().__new__(cls, raw)

    @classmethod
    def parse(cls, raw: str) -> Self:
        """Validate raw and return it as a DeviceID."""
        return cls(raw)
