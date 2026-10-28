"""The devices the reporter knows how to announce."""

from dataclasses import dataclass

from internal.report.reporter import Event


@dataclass(frozen=True)
class Device:
    """A device known to the catalog."""

    name: str
    model: str

    def event(self) -> Event:
        """Return the catalog event for the device."""
        return Event(kind="catalog", subject=self.name + "/" + self.model)


class Catalog:
    """A catalog of devices."""

    def __init__(self, devices: list[Device]) -> None:
        """Create a Catalog holding its own copy of devices."""
        self._devices = list(devices)

    def models(self) -> dict[str, list[str]]:
        """Group the catalog's device names by model."""
        by_model: dict[str, list[str]] = {}
        for d in self._devices:
            by_model.setdefault(d.model, []).append(d.name)
        return by_model

    def find(self, name: str) -> Device | None:
        """Find the device by name."""
        for d in self._devices:
            if d.name == name:
                return d
        return None

    @classmethod
    def parse(cls, text: str) -> "Catalog":
        """Build a Catalog from catalog text, one ``name/model`` device per line."""
        devices = [d for d in map(parse_device, text.splitlines()) if d is not None]
        return cls(devices)


def parse_device(line: str) -> Device | None:
    """Parse one catalog line, written as ``name/model``.

    A blank line is not a device; it parses to None so callers can skip it.
    """
    text = line.strip()
    if not text:
        return None
    name, sep, model = text.partition("/")
    if not sep or not name or not model:
        return None
    return Device(name=name, model=model)
