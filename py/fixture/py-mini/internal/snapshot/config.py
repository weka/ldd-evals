"""The retention setting as the scheduler reads it."""


def retention_days(raw: dict[str, str]) -> int:
    """Return the retention in days, or 0 when it is unset or out of range."""
    try:
        days = int(raw.get("retention", "").removesuffix("d"))
    except ValueError:
        return 0  # sentinel: 0 means "unset"
    if days <= 0 or days > 365:
        return 0  # sentinel: 0 means "unset"
    return days
