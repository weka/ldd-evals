"""Check a webhook endpoint named in a config file."""

import re
import urllib.error
import urllib.request
from collections.abc import Callable
from dataclasses import dataclass
from pathlib import Path

_HTTP_TIMEOUT = 5.0
_DEFAULT_IF_EMPTY = ":-"


@dataclass(frozen=True)
class Result:
    """The status code of the POST; check_webhook returns it only for a 2xx answer."""

    status: int


def check_webhook(path: Path, env: Callable[[str], str | None]) -> Result:
    """Read the endpoint template from the config file, expand it with env and POST to it.

    A non-2xx answer raises OSError. A template with an unclosed "${" raises ValueError.
    """
    endpoint = _trim_slash(_EnvTemplate.parse(path.read_text().strip()).expand(env))
    req = urllib.request.Request(endpoint, data=b"", method="POST")
    try:
        with urllib.request.urlopen(req, timeout=_HTTP_TIMEOUT) as resp:
            return Result(status=int(resp.status))
    except urllib.error.HTTPError as err:
        raise OSError(f"transport: post {endpoint}: status {err.code}") from err
    except urllib.error.URLError as err:
        raise OSError(f"transport: post {endpoint}: {err.reason}") from err


@dataclass(frozen=True)
class _EnvTemplate:
    """A text with references to environment variables.

    The forms are $$, $VAR, ${VAR}, ${VAR:-default} and ${VAR-default}. The ":-" form
    also applies the default when the variable is empty.
    """

    text: str

    @classmethod
    def parse(cls, text: str) -> "_EnvTemplate":
        """Refuse a "${" that has no closing "}"."""
        rest = text
        while (start := rest.find("${")) >= 0:
            closing = rest.find("}", start)
            if closing < 0:
                raise ValueError(f"unclosed reference {rest[start:]!r}")
            rest = rest[closing + 1 :]
        return cls(text)

    def expand(self, env: Callable[[str], str | None]) -> str:
        """Replace each reference with its value from env."""
        ref = re.compile(r"\$(?:(\$)|\{(\w+)(?:(:?-)([^}]*))?\}|(\w+))")

        def replace(match: re.Match[str]) -> str:
            escaped, braced, op, default, bare = match.groups()
            if escaped:
                return "$"
            value = env(braced or bare)
            if op == _DEFAULT_IF_EMPTY and value == "":
                value = None
            if value is None and op:
                return default
            return value or ""

        return ref.sub(replace, self.text)


def _trim_slash(s: str) -> str:
    return s.rstrip("/")
