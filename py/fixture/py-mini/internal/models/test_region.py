import pytest

from internal.models.region import Region


@pytest.mark.parametrize(
    ("raw", "want"),
    [("eu", Region.EU), ("us", Region.US), ("ap", Region.AP)],
)
def test_parse_region_success(raw: str, want: Region) -> None:
    assert Region.parse(raw) == want


@pytest.mark.parametrize("raw", ["", "EU", "mars"])
def test_parse_region_error(raw: str) -> None:
    with pytest.raises(ValueError, match="region"):
        Region.parse(raw)


@pytest.mark.parametrize(
    ("region", "want"),
    [(Region.EU, "eu-central-1"), (Region.US, "us-east-1"), (Region.AP, "ap-southeast-1")],
)
def test_region_zone(region: Region, want: str) -> None:
    assert region.zone() == want
