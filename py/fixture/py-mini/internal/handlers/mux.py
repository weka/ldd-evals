"""A minimal WSGI router: requests and responses as values, handlers as functions."""

import json
from collections.abc import Callable, Iterable
from dataclasses import dataclass, field
from http import HTTPStatus
from typing import Any
from urllib.parse import parse_qsl
from wsgiref.types import StartResponse, WSGIEnvironment


@dataclass(frozen=True)
class Request:
    """One HTTP request, read fully before the handler runs."""

    method: str
    path: str
    query: dict[str, str]
    headers: dict[str, str]
    body: bytes


@dataclass
class Response:
    """The handler's answer."""

    status: int
    body: bytes = b""
    headers: list[tuple[str, str]] = field(default_factory=list)

    def set_header(self, name: str, value: str) -> None:
        """Set or replace a header."""
        self.headers = [(n, v) for n, v in self.headers if n.lower() != name.lower()]
        self.headers.append((name, value))


HandlerFunc = Callable[[Request], Response]


def text(status: int, msg: str) -> Response:
    """Answer with one plain-text line."""
    r = Response(status, (msg + "\n").encode())
    r.set_header("Content-Type", "text/plain; charset=utf-8")
    return r


def write_json(status: int, v: Any) -> Response:
    """Answer with a compact JSON document."""
    r = Response(status, (json.dumps(v, separators=(",", ":")) + "\n").encode())
    r.set_header("Content-Type", "application/json")
    return r


class Mux:
    """Routes (method, path) pairs to handlers and speaks WSGI."""

    def __init__(self) -> None:
        self._routes: dict[tuple[str, str], HandlerFunc] = {}

    def handle(self, method: str, path: str, handler: HandlerFunc) -> None:
        """Register a handler for one method and path."""
        self._routes[(method, path)] = handler

    def dispatch(self, req: Request) -> Response:
        """Run the handler registered for the request."""
        handler = self._routes.get((req.method, req.path))
        if handler is not None:
            return handler(req)
        if any(p == req.path for _, p in self._routes):
            return text(HTTPStatus.METHOD_NOT_ALLOWED, "method not allowed")
        return text(HTTPStatus.NOT_FOUND, "not found")

    def __call__(self, environ: WSGIEnvironment, start_response: StartResponse) -> Iterable[bytes]:
        """Serve one WSGI request."""
        resp = self.dispatch(read_request(environ))
        start_response(f"{resp.status} {HTTPStatus(resp.status).phrase}", resp.headers)
        return [resp.body]


def read_request(environ: WSGIEnvironment) -> Request:
    """Turn a WSGI environ into a Request, reading the whole body."""
    length = int(environ.get("CONTENT_LENGTH") or 0)
    body = environ["wsgi.input"].read(length) if length > 0 else b""
    headers = {
        k[5:].replace("_", "-").lower(): str(v) for k, v in environ.items() if k.startswith("HTTP_")
    }
    for k in ("CONTENT_TYPE", "CONTENT_LENGTH"):
        if environ.get(k):
            headers[k.replace("_", "-").lower()] = str(environ[k])
    return Request(
        method=environ["REQUEST_METHOD"],
        path=environ.get("PATH_INFO", "/"),
        query=dict(parse_qsl(environ.get("QUERY_STRING", ""))),
        headers=headers,
        body=body,
    )
