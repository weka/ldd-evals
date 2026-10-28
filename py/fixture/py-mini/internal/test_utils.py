from datetime import UTC, datetime, timedelta

from internal import utils


def test_truncate() -> None:
    assert utils.truncate("heartbeat", 5) == "heart"
    assert utils.truncate("hb", 5) == "hb"


def test_slugify() -> None:
    assert utils.slugify("Device  #12 / EU") == "device-12-eu"


def test_contains() -> None:
    tags = ["gpu", "region:eu"]
    assert utils.contains(tags, "gpu")
    assert not utils.contains(tags, "cpu")


def test_days_between() -> None:
    a = datetime(2024, 1, 1, tzinfo=UTC)
    b = a + timedelta(hours=72)
    assert utils.days_between(a, b) == 3
    assert utils.days_between(b, a) == 3
