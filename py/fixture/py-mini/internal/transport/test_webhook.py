import threading
from collections.abc import Iterator
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path
from typing import ClassVar

import pytest

from internal.transport.webhook import check_webhook

_ENV = {"EMPTY": "", "HOOK": "alerts"}


class _Hook(BaseHTTPRequestHandler):
    status: ClassVar[int] = 204
    paths: ClassVar[list[str]] = []

    def do_POST(self) -> None:
        type(self).paths.append(self.path)
        self.send_response(type(self).status)
        self.send_header("Content-Length", "0")
        self.end_headers()

    def log_message(self, format: str, *args: object) -> None:
        pass


@pytest.fixture
def hook() -> Iterator[tuple[str, type[_Hook]]]:
    _Hook.status = 204
    _Hook.paths = []
    srv = HTTPServer(("127.0.0.1", 0), _Hook)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    yield f"http://127.0.0.1:{srv.server_port}", _Hook
    srv.shutdown()
    srv.server_close()


@pytest.mark.parametrize(
    ("template", "want_path"),
    [
        ("${HOOK}", "/alerts"),
        ("$HOOK", "/alerts"),
        ("${MISSING:-fallback}", "/fallback"),
        ("${EMPTY:-fallback}", "/fallback"),
        ("x${EMPTY-fallback}", "/x"),
        ("${MISSING-fallback}", "/fallback"),
        ("$$HOOK", "/$HOOK"),
    ],
)
def test_check_webhook_expands_the_endpoint_template(
    hook: tuple[str, type[_Hook]], tmp_path: Path, template: str, want_path: str
) -> None:
    base, handler = hook
    conf = tmp_path / "webhook.conf"
    conf.write_text(f"{base}/{template}/")
    assert check_webhook(conf, _ENV.get).status == 204
    assert handler.paths == [want_path]


def test_check_webhook_reports_a_failure_status(
    hook: tuple[str, type[_Hook]], tmp_path: Path
) -> None:
    base, handler = hook
    handler.status = 502
    conf = tmp_path / "webhook.conf"
    conf.write_text(base)
    with pytest.raises(OSError, match="status 502"):
        check_webhook(conf, _ENV.get)
