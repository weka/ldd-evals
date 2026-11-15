"""Match device tags against a filter expression."""

from internal.tagfilter.split import _split_tag


def match(tags: list[str], expr: str) -> bool:
    """Report whether tags satisfy expr.

    expr is a comma-separated list of terms, and every term must hold: "key:value"
    needs a tag with that key and value, "key" needs a tag with that key and any value,
    and a leading "!" needs no such tag. A key may appear in one term only. A bad
    filter raises ValueError.
    """
    return _Filter.parse(expr).matches(tags)


class _Filter:
    """The parsed terms. A value of "" matches any value."""

    def __init__(self, want: dict[str, str], deny: dict[str, str]) -> None:
        self._want = want
        self._deny = deny

    @classmethod
    def parse(cls, expr: str) -> "_Filter":
        """Parse expr; a bad term or a key in two terms raises ValueError."""
        want: dict[str, str] = {}
        deny: dict[str, str] = {}
        for raw in expr.split(","):
            term = raw.strip()
            into = want
            if term.startswith("!"):
                term, into = term[1:], deny
            parsed = _split_tag(term)
            if parsed is None:
                raise ValueError(f"tag filter: bad term {raw!r}")
            key, value = parsed
            if key in want or key in deny:
                raise ValueError(f"tag filter: key {key!r} twice")
            into[key] = value
        return cls(want, deny)

    def matches(self, tags: list[str]) -> bool:
        """Report whether every wanted tag is present and no denied tag is."""
        wanted = all(self._has(tags, key, value) for key, value in self._want.items())
        denied = any(self._has(tags, key, value) for key, value in self._deny.items())
        return wanted and not denied

    @staticmethod
    def _has(tags: list[str], key: str, value: str) -> bool:
        for tag in tags:
            parsed = _split_tag(tag)
            if parsed is not None and parsed[0] == key and (not value or parsed[1] == value):
                return True
        return False
