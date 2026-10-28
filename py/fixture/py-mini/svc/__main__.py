"""Runs the device fleet backend."""

import argparse
import logging
import os
import random
import sys
import threading
import time
from http import HTTPStatus
from socketserver import ThreadingMixIn
from wsgiref.simple_server import WSGIRequestHandler, WSGIServer, make_server

from internal.env import env
from internal.handlers.mux import HandlerFunc, Mux, Request, Response, text
from internal.handlers.trace import routes
from internal.jobs import Scheduler
from internal.models.grants import Grants, Permission
from internal.repository.device_repository import DeviceRepository
from internal.repository.file_repo import FileRepo
from internal.repository.mem_store import MemStore
from internal.repository.store import Store
from internal.services.device_service import AuditLog, DeviceService
from internal.services.notify import Notifier

_LOG = logging.getLogger("svc")


class _Server(ThreadingMixIn, WSGIServer):
    daemon_threads = True


class _QuietHandler(WSGIRequestHandler):
    def log_message(self, *args: object) -> None:
        return


def main() -> None:
    """Parse the flags, wire the service and serve."""
    parser = argparse.ArgumentParser(description="the device fleet backend")
    parser.add_argument(
        "--dry-run", action="store_true", help="keep devices in memory instead of the JSON store"
    )
    parser.add_argument(
        "--store",
        default=_default_store_path(),
        help="path of the JSON device store (default from STORE_PATH)",
    )
    parser.add_argument(
        "--read-only", action="store_true", help="serve reads only; refuse registrations"
    )
    args = parser.parse_args()

    logging.basicConfig(level=logging.INFO, stream=sys.stderr)
    env.load()

    # Instances restarted by the same deploy would otherwise all hit the
    # queue in the same instant; a little jitter spreads them out.
    time.sleep(random.randint(0, 19) / 1000)

    store: Store
    repo: DeviceRepository
    if args.dry_run:
        mem = MemStore()
        store, repo = mem, mem
    else:
        file_repo = _must_open_file_repo(args.store)
        store, repo = file_repo, file_repo

    try:
        store.list_devices()
    except OSError as err:
        _LOG.error("store not readable: %s", err)
        sys.exit(1)

    notifier = Notifier(os.environ.get("WEBHOOK_URL", ""))
    audit = AuditLog(sys.stderr)
    svc = DeviceService(repo, notifier, audit)

    scheduler = Scheduler()
    threading.Thread(target=scheduler.run, daemon=True).start()

    mux = Mux()
    _routes(mux, store)
    routes(mux, store, svc, _grants_for(read_only=args.read_only))

    port = _listen_port()
    _LOG.info(
        "svc listening on :%d (region %s, %d workers)",
        port,
        env.CONFIG.region,
        env.CONFIG.num_workers,
    )
    with make_server("", port, mux, server_class=_Server, handler_class=_QuietHandler) as srv:
        srv.serve_forever()


def _grants_for(*, read_only: bool) -> Grants:
    """Return the instance's own authority.

    Every instance may read, and only one started writable may register
    devices or accept heartbeats.
    """
    if read_only:
        return Grants([Permission.READ])
    return Grants([Permission.READ, Permission.WRITE])


def _must_open_file_repo(path: str) -> FileRepo:
    try:
        return FileRepo(path)
    except ValueError as err:
        _LOG.error("open store: %s", err)
        sys.exit(1)


def _routes(mux: Mux, store: Store) -> None:
    mux.handle("GET", "/healthz", _healthz(store))


def _healthz(store: Store) -> HandlerFunc:
    def handle(_req: Request) -> Response:
        try:
            store.list_devices()
        except OSError:
            return text(HTTPStatus.SERVICE_UNAVAILABLE, "store unavailable")
        return text(HTTPStatus.OK, "ok")

    return handle


def _listen_port() -> int:
    return int(os.environ.get("PORT") or "8080")


def _default_store_path() -> str:
    return os.environ.get("STORE_PATH") or "devices.json"


if __name__ == "__main__":
    main()
