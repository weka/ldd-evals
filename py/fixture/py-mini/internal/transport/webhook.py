"""Check a webhook endpoint named in a config file."""

import os
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
    """The outcome of one webhook check."""

    status: int


def check_webhook(path: Path, env: Callable[[str], str | None] = os.environ.get) -> Result:
    """Read the endpoint template from the config file and POST to the expanded URL.

    A non-2xx answer raises OSError.
    """
    expanded = _expand_env(path.read_text().strip(), env)
    endpoint = _trim_slash(expanded)
    req = urllib.request.Request(endpoint, data=b"", method="POST")
    try:
        with urllib.request.urlopen(req, timeout=_HTTP_TIMEOUT) as resp:
            return Result(status=int(resp.status))
    except urllib.error.HTTPError as err:
        raise OSError(f"transport: post {endpoint}: status {err.code}") from err
    except urllib.error.URLError as err:
        raise OSError(f"transport: post {endpoint}: {err.reason}") from err


def _expand_env(text: str, env: Callable[[str], str | None]) -> str:
    """Replace $$, $VAR, ${VAR}, ${VAR:-default} and ${VAR-default}.

    The ":-" form also applies the default when the variable is empty.
    """
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

    return ref.sub(replace, text)


def _trim_slash(s: str) -> str:
    return s.rstrip("/")
