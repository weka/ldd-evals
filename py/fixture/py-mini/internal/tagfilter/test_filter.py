import pytest

from internal.tagfilter.filter import match

TAGS = ["region:eu", "Tier=gold", "retired"]


@pytest.mark.parametrize(
    ("expr", "want"),
    [
        ("region:eu", True),
        ("region:us", False),
        ("region", True),
        ("tier:gold", True),
        ("!retired", False),
        ("!zone", True),
        ("region:eu, !retired", False),
        ("region:eu,tier:silver", False),
        (" region : eu ", True),
        ("", True),
    ],
)
def test_match(expr: str, want: bool) -> None:
    assert match(TAGS, expr) is want


@pytest.mark.parametrize(
    "expr", ["region:eu,", "!", ":eu", "region:eu:x", "region:eu,region:us", "region,!region"]
)
def test_match_refuses_a_bad_filter(expr: str) -> None:
    with pytest.raises(ValueError, match="tag filter"):
        match([], expr)


def test_match_finds_any_value_of_a_repeated_key() -> None:
    assert match(["region:eu", "region:us"], "region:us") is True
