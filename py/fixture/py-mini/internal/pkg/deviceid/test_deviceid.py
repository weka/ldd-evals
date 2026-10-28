import pytest

from internal.pkg.deviceid.deviceid import DeviceID


def test_parse_valid() -> None:
    assert str(DeviceID.parse("  dev-42 ")) == "dev-42"


def test_parse_empty() -> None:
    with pytest.raises(ValueError, match="empty"):
        DeviceID.parse("   ")


def test_parse_too_long() -> None:
    with pytest.raises(ValueError, match="at most"):
        DeviceID.parse("x" * 65)
