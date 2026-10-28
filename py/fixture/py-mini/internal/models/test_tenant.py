import pytest

from internal.models.tenant import Tenant


@pytest.mark.parametrize("raw", ["acme", "acme-42", "a" * 32])
def test_parse_tenant_success(raw: str) -> None:
    assert Tenant.parse(raw).id == raw


@pytest.mark.parametrize("raw", ["", "Acme", "a" * 33, "ac me", "ac_me"])
def test_parse_tenant_error(raw: str) -> None:
    with pytest.raises(ValueError, match="tenant"):
        Tenant.parse(raw)
