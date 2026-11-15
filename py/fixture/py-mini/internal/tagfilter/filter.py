"""Match device tags against a filter expression."""

from internal.tagfilter.split import read_tags

_TERM_SEPARATOR = ":"


def match(tags: list[str], expr: str) -> bool:
    """Report whether tags satisfy expr.

    expr is a comma-separated list of terms, and every term must hold: "key:value"
    needs a tag with that key and value, "key" needs a tag with that key and any value,
    and a leading "!" needs no such tag. A key may appear in one term only. An empty
    expr matches every tag list. A bad filter raises ValueError.
    """
    if not expr.strip():
        return True
    return _Filter.parse(expr).matches(read_tags(tags))


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
            key, _, value = term.partition(_TERM_SEPARATOR)
            key, value = key.strip().lower(), value.strip()
            if not key or _TERM_SEPARATOR in value:
                raise ValueError(f"tag filter: bad term {raw!r}")
            if key in want or key in deny:
                raise ValueError(f"tag filter: key {key!r} twice")
            into[key] = value
        return cls(want, deny)

    def matches(self, tags: dict[str, list[str]]) -> bool:
        """Report whether every wanted tag is present and no denied tag is; tags is key → values."""
        wanted = all(_has_value(tags.get(key, []), value) for key, value in self._want.items())
        denied = any(_has_value(tags.get(key, []), value) for key, value in self._deny.items())
        return wanted and not denied


def _has_value(values: list[str], value: str) -> bool:
    return bool(values) if not value else value in values
