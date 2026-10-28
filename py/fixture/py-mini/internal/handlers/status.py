"""The fleet status line."""

from http import HTTPStatus

from internal.handlers.mux import HandlerFunc, Request, Response, text
from internal.repository.store import Store


def status(store: Store) -> HandlerFunc:
    """Return the status handler."""

    def handle(_req: Request) -> Response:
        try:
            devices = store.list_devices()
        except OSError:
            return text(HTTPStatus.SERVICE_UNAVAILABLE, "store unavailable")
        ready = degraded = down = other = 0
        for d in devices:
            match d.status:
                case "READY":
                    ready += 1
                case "DEGRADED":
                    degraded += 1
                case "DOWN":
                    down += 1
                case _:
                    other += 1
        return text(
            HTTPStatus.OK,
            f"devices={len(devices)} ready={ready} degraded={degraded} down={down} other={other}",
        )

    return handle
