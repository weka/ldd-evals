"""A client for a sibling fleet service."""

import socket
import ssl
import urllib.request
from http.client import HTTPResponse

_DEFAULT_PORT = 8080
_DIAL_TIMEOUT = 3.0
_HTTP_TIMEOUT = 5.0


class Client:
    """A client for a sibling service."""

    def __init__(self, host: str, port: int, *, tls: bool) -> None:
        """Create a new Client.

        An out-of-range port falls back to the default service port.
        """
        if port <= 0 or port > 65535:
            port = _DEFAULT_PORT
        self.host = host
        self.port = port
        self.tls = tls

    def health_url(self) -> str:
        """Return the health check URL of the service."""
        return _health_url(self.host, self.port, tls=self.tls)

    def get(self, path: str) -> HTTPResponse:
        """Perform a GET against path on the service."""
        scheme = "http"
        if self.tls:
            scheme = "https"
        url = f"{scheme}://{self.host}:{self.port}{path}"
        try:
            resp: HTTPResponse = urllib.request.urlopen(url, timeout=_HTTP_TIMEOUT)
        except OSError as err:
            raise OSError(f"transport: get {url}: {err}") from err
        return resp

    def ping(self) -> None:
        """Open and close a raw connection to prove the service is reachable."""
        conn = _dial(self.host, self.port, tls=self.tls)
        try:
            conn.close()
        except OSError as err:
            raise OSError(f"transport: close ping: {err}") from err


def _dial(host: str, port: int, *, tls: bool) -> socket.socket:
    if port <= 0 or port > 65535:
        raise ValueError(f"transport: port {port} out of range 1-65535")
    try:
        conn = socket.create_connection((host, port), timeout=_DIAL_TIMEOUT)
    except OSError as err:
        raise OSError(f"transport: dial {host}:{port}: {err}") from err
    if tls:
        ctx = ssl.create_default_context()
        return ctx.wrap_socket(conn, server_hostname=host)
    return conn


def _health_url(host: str, port: int, *, tls: bool) -> str:
    scheme = "http"
    if tls:
        scheme = "https"
    return f"{scheme}://{host}:{port}/healthz"
