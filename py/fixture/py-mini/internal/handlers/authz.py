"""Authorization of the mutating routes."""

from http import HTTPStatus

from internal.handlers.mux import HandlerFunc, Request, Response, text
from internal.models.grants import Grants, Permission


def require_write(grants: Grants, next_handler: HandlerFunc) -> HandlerFunc:
    """Run next_handler only when grants carry write permission.

    A service started read-only keeps serving reads while every mutation is
    refused.
    """

    def handle(req: Request) -> Response:
        if not grants.has(Permission.WRITE):
            return text(HTTPStatus.FORBIDDEN, "write permission required")
        return next_handler(req)

    return handle
