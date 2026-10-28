import io
import json
import threading
import time
from collections.abc import Iterator
from datetime import UTC, datetime
from http.server import BaseHTTPRequestHandler, HTTPServer
from typing import ClassVar

import pytest

from internal.models.alert import Alert
from internal.models.device import Device
from internal.models.job import Job
from internal.models.job_kind import Priority
from internal.models.status import STATUS_READY
from internal.repository.mem_store import MemStore
from internal.services.cache import Cache
from internal.services.device_service import AuditLog, DeviceService, RepositoryError
from internal.services.heartbeat_parser import _normalize_tags, parse_heartbeat_line
from internal.services.notify import Notifier, NotifyError, send_alert
from internal.services.retry import _priority_attempts, _retry_delay
from internal.services.snapshot_service import SnapshotService
from internal.services.sync_service import SyncService
from internal.services.validate import _valid_recipient, validate_alert


def test_normalize_tags() -> None:
    got = _normalize_tags([" a ", "b", "a", "", "region:eu", "region:xx", "region:"])
    assert got == ["a", "b", "region:eu"]


@pytest.mark.parametrize(
    ("raw", "want_id", "expect_err"),
    [
        ("dev-1|ready|1.2.3|a,b", "dev-1", False),
        ("dev-2|degraded|1.0", "dev-2", False),
        ("dev-3|ready", "", True),
        (" |ready|1.0", "", True),
        ("dev-4|SLEEPY|1.0", "", True),
    ],
)
def test_parse_heartbeat_line(raw: str, want_id: str, expect_err: bool) -> None:
    device_id, _, _, _, err = parse_heartbeat_line(raw)
    if expect_err:
        assert err is not None
    else:
        assert err is None
        assert device_id == want_id


def test_parse_heartbeat_line_tags() -> None:
    _, status, version, tags, err = parse_heartbeat_line(
        "dev-1|ready|1.2.3|a, b ,a,region:eu,region:zz"
    )
    assert err is None
    assert (status, version) == (STATUS_READY, "1.2.3")
    assert tags == ["a", "b", "region:eu"]


def test_cache_expires_entries() -> None:
    c = Cache(0.05)
    c.put(Device(id="d1", tenant="acme", status="READY"))
    assert c.get("acme/d1") is not None
    time.sleep(0.1)
    assert c.get("acme/d1") is None
    assert c.count() == 0


class _Capture(BaseHTTPRequestHandler):
    status = 202
    received: ClassVar[list[tuple[str, bytes]]] = []

    def do_POST(self) -> None:
        length = int(self.headers.get("Content-Length") or 0)
        body = self.rfile.read(length)
        _Capture.received.append((self.headers.get("Content-Type", ""), body))
        self.send_response(self.status)
        self.end_headers()

    def log_message(self, *args: object) -> None:
        return


@pytest.fixture
def webhook() -> Iterator[str]:
    _Capture.received = []
    _Capture.status = 202
    srv = HTTPServer(("127.0.0.1", 0), _Capture)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    yield f"http://127.0.0.1:{srv.server_port}"
    srv.shutdown()


def test_notifier_send(webhook: str) -> None:
    Notifier(webhook).send("ops", "device d1 is down")
    assert len(_Capture.received) == 1
    content_type, body = _Capture.received[0]
    assert content_type.lower() == "application/json"
    payload = json.loads(body)
    assert payload["channel"] == "ops"
    assert payload["message"] == "device d1 is down"
    assert payload["sent_at"]


def test_notifier_send_server_error(webhook: str) -> None:
    _Capture.status = 500
    with pytest.raises(NotifyError):
        Notifier(webhook).send("ops", "x")


def test_notifier_without_webhook() -> None:
    Notifier("").send("ops", "x")


def test_send_unknown_channel() -> None:
    with pytest.raises(NotifyError, match="unknown channel"):
        send_alert(Alert(channel="sms", recipient="+15550100", summary="hi"))


def test_valid_recipient() -> None:
    assert _valid_recipient(Alert(channel="email", recipient="ops@example.com", summary=""))
    assert not _valid_recipient(Alert(channel="email", recipient="ops", summary=""))
    assert _valid_recipient(Alert(channel="slack", recipient="#fleet", summary=""))
    assert not _valid_recipient(Alert(channel="pagerduty", recipient="fleet-oncall", summary=""))


def test_validate_alert() -> None:
    validate_alert(Alert(channel="slack", recipient="#fleet", summary="ok"))
    with pytest.raises(ValueError, match="empty summary"):
        validate_alert(Alert(channel="slack", recipient="#fleet", summary=""))


def test_retry_delay() -> None:
    assert _retry_delay(Alert(channel="pagerduty", recipient="", summary="")) == 0.5
    assert _retry_delay(Alert(channel="slack", recipient="", summary="")) == 2.0
    assert _retry_delay(Alert(channel="email", recipient="", summary="")) == 5.0


def test_priority_attempts() -> None:
    assert _priority_attempts(Priority.LOW) == 1
    assert _priority_attempts(Priority.MEDIUM) == 3
    assert _priority_attempts(Priority.HIGH) == 1


def test_audit_log_write() -> None:
    buf = io.StringIO()
    a = AuditLog(buf)
    a.write("hello")
    assert a.count() == 1
    assert "audit: hello" in buf.getvalue()


def _service(repo: MemStore | None = None) -> DeviceService:
    return DeviceService(repo or MemStore(), Notifier(""), AuditLog(None))


def test_device_service_summarize() -> None:
    d = Device(
        id="d1",
        tenant="acme",
        status="READY",
        version="1.0",
        tags=["a", "b"],
        last_seen=datetime(2024, 1, 2, 3, 4, 5, tzinfo=UTC),
    )
    got = _service().summarize(d)
    for want in [
        "acme/d1",
        "status=READY",
        "version=1.0",
        "tags=a,b",
        "last_seen=2024-01-02T03:04:05Z",
        "online",
    ]:
        assert want in got


def test_device_service_render() -> None:
    s = _service()
    d = Device(id="d1", tenant="acme", status="DOWN")
    assert s.render(d, True) == "d1 DOWN"
    assert "status=DOWN" in s.render(d, False)


def test_device_service_score() -> None:
    s = _service()
    now = datetime.now(UTC)
    assert s.score(Device(id="d", tenant="t", status="READY", tags=["a"], last_seen=now)) == 110
    assert s.score(Device(id="d", tenant="t", status="DEGRADED", last_seen=now)) == 50
    assert s.score(Device(id="d", tenant="t", status="DOWN", tags=["a", "b"], last_seen=now)) == 0


def test_device_service_get_caches() -> None:
    repo = MemStore()
    repo.save(Device(id="d1", tenant="acme", status="READY"))
    s = _service(repo)
    for _ in range(2):
        assert s.get("acme", "d1").status == STATUS_READY
    st = s.stats()
    assert (st.hits, st.misses, st.cached) == (1, 1, 1)
    with pytest.raises(RepositoryError):
        s.get("acme", "missing")


def test_snapshot_service_run() -> None:
    repo = MemStore()
    for device_id in ["d1", "d2", "d3"]:
        repo.save(Device(id=device_id, tenant="acme", status="READY"))
    svc = SnapshotService(repo, AuditLog(None))
    assert svc.run() == 3
    assert len(svc.taken()) == 3
    with pytest.raises(ValueError, match="unknown job kind"):
        svc.handle(Job(id="j", kind="backup"))


def test_sync_service_dry_run() -> None:
    repo = MemStore()
    repo.save(Device(id="d1", tenant="acme", status="READY", tags=["region:eu"]))
    repo.save(Device(id="d2", tenant="acme", status="READY", tags=["region:us"]))
    svc = SyncService(repo, Notifier(""), "eu", 10, 0, True)
    assert svc.run() == 1
    assert svc.last_run_at() is not None
    assert svc._in_region(Device(id="x", tenant="t", status="READY", tags=["region:eu"]))
    assert not svc._in_region(Device(id="x", tenant="t", status="READY", tags=["region:us"]))
