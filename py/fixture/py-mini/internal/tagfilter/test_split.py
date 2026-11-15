import pytest

from internal.tagfilter.split import read_tags


@pytest.mark.parametrize(
    ("tags", "want"),
    [
        (["region:eu"], {"region": ["eu"]}),
        (["Tier=gold"], {"tier": ["gold"]}),
        (["retired"], {"retired": [""]}),
        ([" Zone : a "], {"zone": ["a"]}),
        (["region:eu", "region:us"], {"region": ["eu", "us"]}),
        ([":eu", "a:b:c", "a=b=c", ""], {}),
    ],
)
def test_read_tags(tags: list[str], want: dict[str, list[str]]) -> None:
    assert read_tags(tags) == want
