import pytest

from internal.transport.client import Client


@pytest.mark.parametrize(
    ("host", "port", "tls", "want"),
    [
        ("db", 5432, False, "http://db:5432/healthz"),
        ("db", 5432, True, "https://db:5432/healthz"),
        ("db", 70000, False, "http://db:8080/healthz"),
        ("db", 0, True, "https://db:8080/healthz"),
    ],
)
def test_client_health_url(host: str, port: int, tls: bool, want: str) -> None:
    assert Client(host, port, tls=tls).health_url() == want
