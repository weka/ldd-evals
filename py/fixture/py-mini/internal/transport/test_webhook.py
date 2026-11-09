import threading
from collections.abc import Callable, Iterator
from dataclasses import dataclass, field
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path

import pytest

from internal.transport.webhook import check_webhook


@dataclass
class _Hook:
    base: str
    paths: list[str] = field(default_factory=list)


@pytest.fixture
def start_hook() -> Iterator[Callable[[int], _Hook]]:
    servers: list[HTTPServer] = []

    def start(status: int) -> _Hook:
        paths: list[str] = []

        class Handler(BaseHTTPRequestHandler):
            def do_POST(self) -> None:
                paths.append(self.path)
                self.send_response(status)
                self.send_header("Content-Length", "0")
                self.end_headers()

            def log_message(self, format: str, *args: object) -> None:
                pass

        srv = HTTPServer(("127.0.0.1", 0), Handler)
        threading.Thread(target=srv.serve_forever, daemon=True).start()
        servers.append(srv)
        return _Hook(base=f"http://127.0.0.1:{srv.server_port}", paths=paths)

    yield start
    for srv in servers:
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
    start_hook: Callable[[int], _Hook], tmp_path: Path, template: str, want_path: str
) -> None:
    hook = start_hook(204)
    env = {"EMPTY": "", "HOOK": "alerts"}
    conf = tmp_path / "webhook.conf"
    conf.write_text(f"{hook.base}/{template}/")
    assert check_webhook(conf, env.get).status == 204
    assert hook.paths == [want_path]


def test_check_webhook_reports_a_failure_status(
    start_hook: Callable[[int], _Hook], tmp_path: Path
) -> None:
    hook = start_hook(502)
    conf = tmp_path / "webhook.conf"
    conf.write_text(hook.base)
    with pytest.raises(OSError, match="status 502"):
        check_webhook(conf, lambda _name: None)
