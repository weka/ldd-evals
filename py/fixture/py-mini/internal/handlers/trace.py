"""The device list handler and the route table."""

from http import HTTPStatus
from typing import Any

from internal.handlers.authz import require_write
from internal.handlers.devices import register
from internal.handlers.heartbeat import heartbeat
from internal.handlers.mux import Mux, Request, Response, text, write_json
from internal.handlers.status import status
from internal.models.device import Device
from internal.models.grants import Grants
from internal.repository.store import Store
from internal.services.device_service import DeviceService


class Handler:
    """Handler is a handler."""

    def __init__(self, store: Store) -> None:
        """Create a new Handler."""
        self.store = store

    def list_devices(self, req: Request) -> Response:
        """List the devices as JSON."""
        try:
            devices = self.store.list_devices()
        except OSError:
            return text(HTTPStatus.SERVICE_UNAVAILABLE, "store unavailable")
        resp = write_json(HTTPStatus.OK, [_device_json(d) for d in devices])
        self._trace(resp, req.headers.get("x-trace", ""))
        return resp

    def _trace(self, resp: Response, trace_id: str) -> None:
        """Echo the caller's trace id.

        A device's log lines and the request that produced them can be joined later.
        """
        resp.set_header("X-Trace", trace_id)


def _device_json(d: Device) -> dict[str, Any]:
    return {
        "id": d.id,
        "tenant": d.tenant,
        "status": d.status,
        "version": d.version,
        "tags": d.tags,
        "last_seen": d.last_seen.isoformat(),
    }


def routes(mux: Mux, store: Store, svc: DeviceService, grants: Grants) -> None:
    """Register the handlers on mux; the mutating routes run only when grants allow writes."""
    h = Handler(store)
    mux.handle("GET", "/status", status(store))
    mux.handle("GET", "/devices", h.list_devices)
    mux.handle("POST", "/devices", require_write(grants, register(store)))
    mux.handle("POST", "/heartbeat", require_write(grants, heartbeat(svc)))
