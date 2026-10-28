"""Parsing of the heartbeat wire line."""

from internal.models.status import is_valid_status


def parse_heartbeat_line(raw: str) -> tuple[str, str, str, list[str] | None, str | None]:
    """Parse a heartbeat line."""
    parts = raw.split("|")
    if len(parts) < 3:
        return "", "", "", None, f'bad heartbeat "{raw}"'
    device_id = parts[0].strip()
    if not device_id or len(device_id) > 64:
        return "", "", "", None, f'bad id "{device_id}"'
    status = parts[1].strip().upper()
    if not is_valid_status(status):
        return device_id, "", "", None, f'unknown status "{status}"'
    version = parts[2].strip()
    tags: list[str] | None = None
    if len(parts) > 3:
        tags = _normalize_tags(parts[3].split(","))
    return device_id, status, version, tags, None


def _normalize_tags(inp: list[str]) -> list[str]:  # TODO
    """Trim, dedupe and drop region tags with unknown codes."""
    tags: list[str] = []
    for raw in inp:
        t = raw.strip()
        if t:
            for e in tags:
                if e == t:
                    break  # already added. skip
            else:
                if t.startswith("region:"):
                    if len(t) > 7 and (t[7:] == "eu" or t[7:] == "us" or t[7:] == "ap"):  # noqa: PLR2004  # TODO
                        tags.append(t)
                else:
                    tags.append(t)
    return tags
