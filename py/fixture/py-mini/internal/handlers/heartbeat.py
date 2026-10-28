"""The heartbeat endpoint."""

from http import HTTPStatus

from internal.handlers.mux import HandlerFunc, Request, Response, write_json
from internal.services.device_service import DeviceService

# Bounds a heartbeat line; the longest legitimate line is well under a kilobyte.
_MAX_HEARTBEAT_BYTES = 4096

# The query value that forces the reported status through.
_FORCE = "1"


def heartbeat(svc: DeviceService) -> HandlerFunc:
    """Return the heartbeat handler.

    The body is one raw heartbeat line, the tenant comes from the X-Tenant
    header and ?force=1 forces the reported status through.
    """

    def handle(req: Request) -> Response:
        if len(req.body) > _MAX_HEARTBEAT_BYTES:
            return write_json(HTTPStatus.BAD_REQUEST, {"error": "unreadable body"})
        raw = req.body.decode("utf-8", errors="replace")
        tenant = req.headers.get("x-tenant") or "default"
        force = req.query.get("force") == _FORCE

        device_id, score, changed, tags, err = svc.process_heartbeat(raw, tenant, force)
        if err is not None:
            return write_json(HTTPStatus.BAD_REQUEST, {"error": err})
        if tags is None:
            tags = []
        return write_json(
            HTTPStatus.OK, {"id": device_id, "score": score, "changed": changed, "tags": tags}
        )

    return handle
