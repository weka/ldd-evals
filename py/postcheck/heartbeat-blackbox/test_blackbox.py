"""The hidden top-rung oracle for every refactor case that touches the heartbeat path.

It starts the fixture's service from $EVAL_DIR (`python -m svc --dry-run`) against
a local webhook, replays a fixed sequence of heartbeat lines over HTTP and
compares status codes and bodies with a table recorded from the unmodified
fixture. Black-box over the running service on purpose: it survives any
internal API change, so an agent can rename, split or move process_heartbeat
freely as long as POST /heartbeat behaves the same. It lives outside the
fixture so the agent under test never sees it.

The table is go-mini's: expected.tsv is byte-identical to the Go suite's, which
is what makes the two fixtures the same service. Re-record only when the
contract intentionally changes, and then in both suites:

    EVAL_DIR=<scaffold> BLACKBOX_RECORD=expected.tsv pytest test_blackbox.py
"""

import os
import socket
import subprocess
import sys
import threading
import time
import urllib.error
import urllib.request
from collections.abc import Iterator
from dataclasses import dataclass
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path

import pytest

NO_TENANT = "-"
# How many leading webhook POSTs answer 500; the service retries twice with a
# backoff, so the first DOWN transition costs three POSTs and every later one
# costs one.
WEBHOOK_FAILURES = 2
# The total number of webhook deliveries the recorded sequence produces: 3 for
# the first DOWN transition and 1 for each of the three later ones.
WANT_WEBHOOK_POSTS = 6
HEALTH_DEADLINE = 20.0
HEALTH_INTERVAL = 0.05

EXPECTED = Path(__file__).with_name("expected.tsv")


@dataclass(frozen=True)
class Step:
    """One recorded request/response pair; tenant "-" sends no X-Tenant header."""

    tenant: str
    force: bool
    body: str
    want_code: int
    want_body: str


def parse_tsv(text: str) -> list[Step]:
    """Read the `#\ttenant\tforce\tbody\tstatus\tresponse` table; force is "1" or ""."""
    steps = []
    for n, line in enumerate(text.rstrip("\n").split("\n"), start=1):
        if line.startswith("#"):
            continue
        fields = line.split("\t")
        if len(fields) != 6:
            raise ValueError(f"expected.tsv line {n}: want 6 tab-separated fields, got {len(fields)}")
        steps.append(Step(fields[1], fields[2] == "1", fields[3], int(fields[4]), fields[5]))
    return steps


def render_tsv(steps: list[Step]) -> str:
    out = ["#\ttenant\tforce\tbody\tstatus\tresponse"]
    for i, s in enumerate(steps, start=1):
        out.append(f"{i}\t{s.tenant}\t{'1' if s.force else ''}\t{s.body}\t{s.want_code}\t{s.want_body}")
    return "\n".join(out) + "\n"


class Webhook(BaseHTTPRequestHandler):
    """The ops channel: fails its first WEBHOOK_FAILURES POSTs with 500, keeps every body."""

    bodies: list[str] = []
    lock = threading.Lock()

    def do_POST(self) -> None:  # noqa: N802
        length = int(self.headers.get("Content-Length") or 0)
        body = self.rfile.read(length).decode()
        with Webhook.lock:
            Webhook.bodies.append(body)
            n = len(Webhook.bodies)
        self.send_response(500 if n <= WEBHOOK_FAILURES else 200)
        self.end_headers()

    def log_message(self, *args: object) -> None:
        return


@pytest.fixture
def webhook() -> Iterator[str]:
    Webhook.bodies = []
    srv = HTTPServer(("127.0.0.1", 0), Webhook)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    yield f"http://127.0.0.1:{srv.server_port}"
    srv.shutdown()


def free_port() -> int:
    s = socket.socket()
    s.bind(("127.0.0.1", 0))
    port = int(s.getsockname()[1])
    s.close()
    return port


@pytest.fixture
def service(webhook: str) -> Iterator[str]:
    """Start `python -m svc --dry-run` in $EVAL_DIR and yield its base URL once /healthz answers."""
    eval_dir = os.environ.get("EVAL_DIR")
    if not eval_dir:
        pytest.skip("EVAL_DIR not set: point it at a scaffolded py-mini checkout")
    eval_dir = os.path.abspath(eval_dir)
    port = free_port()
    env = dict(
        os.environ,
        PORT=str(port),
        WEBHOOK_URL=webhook,
        FLAP_WINDOW_SEC="30",
        NUM_WORKERS="1",
        BATCH="4",
        REGION="eu",
        PYTHONDONTWRITEBYTECODE="1",
    )
    proc = subprocess.Popen(
        [sys.executable, "-m", "svc", "--dry-run"],
        cwd=eval_dir,
        env=env,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
    )
    base = f"http://127.0.0.1:{port}"
    deadline = time.monotonic() + HEALTH_DEADLINE
    try:
        while time.monotonic() < deadline:
            if proc.poll() is not None:
                break
            try:
                with urllib.request.urlopen(base + "/healthz", timeout=1) as resp:
                    if resp.status == 200:
                        break
            except (urllib.error.URLError, OSError):
                time.sleep(HEALTH_INTERVAL)
        else:
            proc.kill()
            out = proc.communicate()[0].decode(errors="replace")
            pytest.fail(f"svc never became healthy on {base} within {HEALTH_DEADLINE}s\n{out}")
        if proc.poll() is not None:
            out = proc.communicate()[0].decode(errors="replace")
            pytest.fail(f"svc exited with {proc.returncode} before becoming healthy\n{out}")
        yield base
    finally:
        proc.kill()
        proc.wait()


def post_heartbeat(base: str, s: Step) -> tuple[int, str]:
    url = base + "/heartbeat" + ("?force=1" if s.force else "")
    req = urllib.request.Request(
        url, data=s.body.encode(), headers={"Content-Type": "text/plain"}, method="POST"
    )
    if s.tenant != NO_TENANT:
        req.add_header("X-Tenant", s.tenant)
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            return int(resp.status), resp.read().decode().strip()
    except urllib.error.HTTPError as err:
        return err.code, err.read().decode().strip()


def test_heartbeat_contract(service: str) -> None:
    recorded = parse_tsv(EXPECTED.read_text())
    record_path = os.environ.get("BLACKBOX_RECORD")
    observed: list[Step] = []
    mismatches: list[str] = []
    for i, s in enumerate(recorded, start=1):
        code, body = post_heartbeat(service, s)
        observed.append(Step(s.tenant, s.force, s.body, code, body))
        if code != s.want_code or body != s.want_body:
            tag = "(recording: the table is being rewritten)" if record_path else "mismatch"
            mismatches.append(
                f"line {i} {tag}: tenant={s.tenant} force={s.force} body={s.body!r}\n"
                f"  got  {code} {body}\n  want {s.want_code} {s.want_body}"
            )

    with Webhook.lock:
        posts = list(Webhook.bodies)
    problems = list(mismatches)
    if len(posts) != WANT_WEBHOOK_POSTS:
        problems.append(f"webhook received {len(posts)} POSTs, want {WANT_WEBHOOK_POSTS}")
    for i, p in enumerate(posts, start=1):
        if '"channel":"ops"' not in p:
            problems.append(f'webhook POST {i} lacks "channel":"ops": {p}')

    if record_path:
        Path(record_path).write_text(render_tsv(observed))
        print(f"recorded {len(observed)} lines and {len(posts)} webhook POSTs to {record_path}")

    assert not problems, "\n".join(problems)
    print(f"{len(recorded)} heartbeat lines matched; webhook received {len(posts)} POSTs")


def test_expected_tsv_matches_go_table() -> None:
    """The table has 40 lines and the Go suite's shape; a re-recording must land in both suites."""
    steps = parse_tsv(EXPECTED.read_text())
    assert len(steps) == 40
    assert steps[0] == Step("acme", False, "dev-1|READY|1.0", 200, '{"id":"dev-1","score":100,"changed":true,"tags":[]}')
    assert render_tsv(steps) == EXPECTED.read_text()
