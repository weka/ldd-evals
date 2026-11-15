"""Read one device tag."""

_SEPARATORS = ":="


def _split_tag(tag: str) -> tuple[str, str] | None:
    """Read "key:value", "key=value" or a bare "key".

    The key is compared without case; a value with a second separator is refused.
    """
    tag = tag.strip()
    key, value = tag, ""
    for i, ch in enumerate(tag):
        if ch in _SEPARATORS:
            key, value = tag[:i], tag[i + 1 :].strip()
            break
    key = key.strip().lower()
    if not key or any(sep in value for sep in _SEPARATORS):
        return None
    return key, value
