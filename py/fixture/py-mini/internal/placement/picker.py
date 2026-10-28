"""Picks the nodes that hold a snapshot's replicas."""

import logging
from dataclasses import dataclass


@dataclass
class Node:
    """A storage node."""

    id: str
    zone: str
    capacity: int


class Placer:
    """Placer is a placer."""

    def __init__(self) -> None:
        """Create a new Placer."""
        self.logger = logging.getLogger("placement")

    def pick(self, nodes: list[Node], zone: str) -> tuple[Node | None, Node | None, str | None]:
        """Pick a primary node in zone and a secondary node outside it."""
        primary, secondary, err = self._pick_replicas(nodes, zone)
        if err is not None:
            self.logger.info("placement: %s", err)
            return None, None, err
        return primary, secondary, None

    def _pick_replicas(
        self, nodes: list[Node], zone: str
    ) -> tuple[Node | None, Node | None, str | None]:
        primary: Node | None = None
        secondary: Node | None = None
        primary_found = False
        secondary_found = False
        for n in nodes:
            if not n.zone or n.capacity <= 0:
                continue
            if n.zone == zone:
                if primary_found:
                    continue
                primary = n
                primary_found = True
                continue
            if secondary_found:
                continue
            secondary = n
            secondary_found = True
        if not primary_found or not secondary_found:
            return None, None, f'no placement for zone "{zone}"'
        return primary, secondary, None
