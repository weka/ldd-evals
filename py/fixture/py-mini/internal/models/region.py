"""The regions the fleet is deployed in."""

from enum import StrEnum
from typing import Self


class Region(StrEnum):
    """The geographic region a device reports from.

    Values come from Region.parse, so a Region in circulation is always one of
    the members below.
    """

    EU = "eu"
    US = "us"
    AP = "ap"

    @classmethod
    def parse(cls, raw: str) -> Self:
        """Accept the codes devices send in their region: tag."""
        try:
            return cls(raw)
        except ValueError:
            raise ValueError(f'region "{raw}": want one of eu, us, ap') from None

    def zone(self) -> str:
        """Map a region to the storage zone its snapshots are written to."""
        match self:
            case Region.EU:
                return "eu-central-1"
            case Region.US:
                return "us-east-1"
            case Region.AP:
                return "ap-southeast-1"
