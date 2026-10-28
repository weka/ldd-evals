"""Shared string and time helpers."""

from datetime import datetime


def truncate(s: str, n: int) -> str:
    """Truncate s to at most n characters."""
    if n <= 0:
        return ""
    if len(s) <= n:
        return s
    return s[:n]


def slugify(s: str) -> str:
    """Lowercase s and replace runs of non-alphanumerics with a dash."""
    out: list[str] = []
    dash = False
    for c in s.lower():
        if c.isalnum():
            out.append(c)
            dash = False
            continue
        if not dash and out:
            out.append("-")
            dash = True
    return "".join(out).removesuffix("-")


def contains(xs: list[str], x: str) -> bool:
    """Report whether xs contains x."""
    return any(v == x for v in xs)


def days_between(a: datetime, b: datetime) -> int:
    """Return the number of whole days from a to b."""
    if b < a:
        a, b = b, a
    return int((b - a).total_seconds() // 86400)
