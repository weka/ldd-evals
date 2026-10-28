import json
import threading
import time
import urllib.error
import urllib.request
from collections.abc import Iterator
from datetime import UTC, datetime
from typing import Any
from wsgiref.simple_server import WSGIRequestHandler, make_server

import pytest

from internal.handlers.mux import Mux
from internal.handlers.trace import routes
from internal.mocks.repo import Repo
from internal.models.device import Device
from internal.models.grants import Grants, Permission
from internal.models.status import STATUS_BOOTING, STATUS_READY
from internal.services.device_service import AuditLog, DeviceService
from internal.services.notify import Notifier


class _Quiet(WSGIRequestHandler):
    def log_message(self, *args: object) -> None:
        return


@pytest.fixture
def fleet() -> Iterator[tuple[str, Repo]]:
    """Build the whole service stack over a mock repository.

    A test can drive it the way a device does: one HTTP request per heartbeat.
    """
    repo = Repo(
        devices={
            "acme/dev-1": Device(
                id="dev-1", tenant="acme", status=STATUS_BOOTING, last_seen=datetime.now(UTC)
            )
        }
    )
    svc = DeviceService(repo, Notifier(""), AuditLog(None))
    mux = Mux()
    routes(mux, repo, svc, Grants([Permission.READ, Permission.WRITE]))
    srv = make_server("127.0.0.1", 0, mux, handler_class=_Quiet)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    yield f"http://127.0.0.1:{srv.server_port}", repo
    srv.shutdown()


def _post_heartbeat(base: str, tenant: str, line: str) -> tuple[int, dict[str, Any]]:
    req = urllib.request.Request(
        base + "/heartbeat",
        data=line.encode(),
        headers={"Content-Type": "text/plain", "X-Tenant": tenant},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req) as resp:
            return int(resp.status), dict(json.loads(resp.read()))
    except urllib.error.HTTPError as err:
        return err.code, dict(json.loads(err.read()))


def test_heartbeat_rejects_overlong_id(fleet: tuple[str, Repo]) -> None:
    base, repo = fleet
    code, reply = _post_heartbeat(base, "acme", "x" * 65 + "|ready|1.0")
    assert code == 400
    assert reply["error"] == "bad id"
    assert repo.calls.get("save", 0) == 0


def test_heartbeat_rejects_missing_fields(fleet: tuple[str, Repo]) -> None:
    base, _ = fleet
    code, reply = _post_heartbeat(base, "acme", "dev-1|ready")
    assert code == 400
    assert reply["error"] == "bad heartbeat"


def test_heartbeat_rejects_unknown_status(fleet: tuple[str, Repo]) -> None:
    base, repo = fleet
    code, reply = _post_heartbeat(base, "acme", "dev-1|SLEEPY|1.0")
    assert code == 400
    assert "unknown status" in reply["error"]
    assert repo.calls.get("save", 0) == 0


def test_heartbeat_saves_known_device_once(fleet: tuple[str, Repo]) -> None:
    base, repo = fleet
    code, reply = _post_heartbeat(base, "acme", "dev-1|ready|1.2.3|gpu, region:eu ,gpu,region:mars")
    assert code == 200, reply
    assert (reply["id"], reply["changed"]) == ("dev-1", True)
    assert reply["score"] == 120
    assert reply["tags"] == ["gpu", "region:eu"]
    assert repo.calls["save"] == 1
    assert repo.calls["get"] == 1
    stored = repo.devices["acme/dev-1"]
    assert (stored.status, stored.version) == (STATUS_READY, "1.2.3")


def test_heartbeat_creates_unknown_device(fleet: tuple[str, Repo]) -> None:
    base, repo = fleet
    code, reply = _post_heartbeat(base, "acme", "dev-9|down|2.0")
    assert code == 200, reply
    assert (reply["score"], reply["tags"]) == (0, [])
    assert repo.calls["save"] == 2
    assert "acme/dev-9" in repo.devices


def test_heartbeat_repeated_line_keeps_status(fleet: tuple[str, Repo]) -> None:
    base, repo = fleet
    first, _ = _post_heartbeat(base, "acme", "dev-1|ready|1.0")
    assert first == 200
    # let the first heartbeat settle before the same line arrives again
    time.sleep(0.12)
    second, reply = _post_heartbeat(base, "acme", "dev-1|ready|1.0")
    assert second == 200
    assert reply["changed"] is False
    assert repo.calls["save"] == 1
    assert repo.devices["acme/dev-1"].status == STATUS_READY
