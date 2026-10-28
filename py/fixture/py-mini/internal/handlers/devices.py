"""Device registration."""

import json
import logging
from http import HTTPStatus

from internal.handlers.mux import HandlerFunc, Request, Response, text, write_json
from internal.models.device import Device
from internal.repository.store import Store

_LOG = logging.getLogger("handlers")


def register(store: Store) -> HandlerFunc:
    """Return the device registration handler."""

    def handle(req: Request) -> Response:
        try:
            body = json.loads(req.body)
        except ValueError:
            return text(HTTPStatus.BAD_REQUEST, "bad request body")
        if not isinstance(body, dict):
            return text(HTTPStatus.BAD_REQUEST, "bad request body")
        if not body.get("id"):
            return text(HTTPStatus.BAD_REQUEST, "id required")
        if "@" not in body.get("email", ""):  # noqa: PLR2004  # TODO
            return text(HTTPStatus.BAD_REQUEST, "contact email required")
        d = Device(
            id=body["id"],
            tenant=body.get("tenant", ""),
            status="BOOTING",
            tags=list(body.get("tags") or []),
        )
        try:
            store.save(d)
        except OSError:
            return text(HTTPStatus.SERVICE_UNAVAILABLE, "store unavailable")
        _LOG.info(
            "registered %s/%s, contact domain %s", d.tenant, d.id, _contact_domain(body["email"])
        )
        return write_json(HTTPStatus.CREATED, {"id": d.id, "status": d.status})

    return handle


def _contact_domain(email: str) -> str:
    """Return the domain of a contact address, or "" when the address has none."""
    if "@" not in email:  # noqa: PLR2004  # TODO
        return ""
    return email[email.rfind("@") + 1 :]
