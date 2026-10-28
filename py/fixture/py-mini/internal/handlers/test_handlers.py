import json
import threading
import urllib.error
import urllib.request
from collections.abc import Callable, Iterator
from wsgiref.simple_server import WSGIRequestHandler, make_server

import pytest

from internal.handlers.devices import register
from internal.handlers.mux import Mux, Request
from internal.handlers.status import status
from internal.handlers.trace import Handler, routes
from internal.models.device import Device
from internal.models.grants import Grants, Permission
from internal.models.status import STATUS_BOOTING, STATUS_DEGRADED, STATUS_DOWN, STATUS_READY
from internal.repository.mem_store import MemStore
from internal.services.device_service import AuditLog, DeviceService
from internal.services.notify import Notifier


def _seeded_store() -> MemStore:
    store = MemStore()
    for d in [
        Device(id="a", tenant="t1", status=STATUS_READY),
        Device(id="b", tenant="t1", status=STATUS_READY),
        Device(id="c", tenant="t1", status=STATUS_DEGRADED),
        Device(id="d", tenant="t2", status=STATUS_DOWN),
        Device(id="e", tenant="t2", status=STATUS_BOOTING),
    ]:
        store.save(d)
    return store


def _request(
    method: str, path: str, body: bytes = b"", headers: dict[str, str] | None = None
) -> Request:
    return Request(method=method, path=path, query={}, headers=headers or {}, body=body)


def test_status_counts_devices_by_status() -> None:
    resp = status(_seeded_store())(_request("GET", "/status"))
    assert resp.status == 200
    assert resp.body == b"devices=5 ready=2 degraded=1 down=1 other=1\n"


def test_register_stores_booting_device() -> None:
    store = MemStore()
    body = b'{"id":"dev-1","tenant":"t1","email":"ops@example.com","tags":["rack:7"]}'
    resp = register(store)(_request("POST", "/devices", body))
    assert resp.status == 201, resp.body
    assert json.loads(resp.body) == {"id": "dev-1", "status": STATUS_BOOTING}
    d = store.get("t1", "dev-1")
    assert d.status == STATUS_BOOTING
    assert d.tags == ["rack:7"]


def test_register_rejects_missing_id() -> None:
    resp = register(MemStore())(
        _request("POST", "/devices", b'{"tenant":"t1","email":"ops@example.com"}')
    )
    assert resp.status == 400


def test_register_rejects_missing_contact() -> None:
    store = MemStore()
    resp = register(store)(
        _request("POST", "/devices", b'{"id":"dev-1","tenant":"t1","email":"ops"}')
    )
    assert resp.status == 400
    assert store.list_devices() == []


def test_register_rejects_malformed_json() -> None:
    resp = register(MemStore())(_request("POST", "/devices", b"{"))
    assert resp.status == 400


def test_handler_list_echoes_trace_header() -> None:
    resp = Handler(_seeded_store()).list_devices(
        _request("GET", "/devices", headers={"x-trace": "abc-123"})
    )
    assert resp.status == 200
    assert ("X-Trace", "abc-123") in resp.headers
    assert len(json.loads(resp.body)) == 5


class _Quiet(WSGIRequestHandler):
    def log_message(self, *args: object) -> None:
        return


@pytest.fixture
def serve() -> Iterator[Callable[[Mux], str]]:
    servers = []

    def start(mux: Mux) -> str:
        srv = make_server("127.0.0.1", 0, mux, handler_class=_Quiet)
        servers.append(srv)
        threading.Thread(target=srv.serve_forever, daemon=True).start()
        return f"http://127.0.0.1:{srv.server_port}"

    yield start
    for srv in servers:
        srv.shutdown()


def _get(url: str) -> int:
    with urllib.request.urlopen(url) as resp:
        return int(resp.status)


def _post(url: str, body: bytes) -> int:
    req = urllib.request.Request(url, data=body, headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req) as resp:
            return int(resp.status)
    except urllib.error.HTTPError as err:
        return err.code


def _stack(store: MemStore, grants: Grants) -> Mux:
    mux = Mux()
    svc = DeviceService(store, Notifier(""), AuditLog(None))
    routes(mux, store, svc, grants)
    return mux


def test_routes_serves_status_and_devices(serve: Callable[[Mux], str]) -> None:
    store = _seeded_store()
    base = serve(_stack(store, Grants([Permission.READ, Permission.WRITE])))
    assert _get(base + "/status") == 200
    assert (
        _post(base + "/devices", b'{"id":"dev-9","tenant":"t3","email":"ops@example.com"}') == 201
    )


def test_routes_read_only_grants_refuse_writes(serve: Callable[[Mux], str]) -> None:
    store = _seeded_store()
    base = serve(_stack(store, Grants([Permission.READ])))
    assert (
        _post(base + "/devices", b'{"id":"dev-9","tenant":"t3","email":"ops@example.com"}') == 403
    )
    assert all(d.id != "dev-9" for d in store.list_devices())
