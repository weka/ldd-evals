import pytest

from internal.placement.picker import Node, Placer


def _fleet() -> list[Node]:
    return [
        Node(id="n0", zone="", capacity=10),
        Node(id="n1", zone="eu", capacity=0),
        Node(id="n2", zone="eu", capacity=5),
        Node(id="n3", zone="eu", capacity=7),
        Node(id="n4", zone="us", capacity=3),
        Node(id="n5", zone="ap", capacity=9),
    ]


@pytest.mark.parametrize(
    ("nodes", "zone", "want_primary", "want_secondary", "expect_err"),
    [
        (_fleet(), "eu", "n2", "n4", False),
        (_fleet(), "us", "n4", "n2", False),
        (
            [Node(id="a", zone="eu", capacity=1), Node(id="b", zone="us", capacity=1)],
            "eu",
            "a",
            "b",
            False,
        ),
        (_fleet(), "sa", "", "", True),
        (_fleet()[:4], "eu", "", "", True),
        ([], "eu", "", "", True),
    ],
)
def test_placer_pick(
    nodes: list[Node], zone: str, want_primary: str, want_secondary: str, expect_err: bool
) -> None:
    primary, secondary, err = Placer().pick(nodes, zone)
    if expect_err:
        assert err is not None
    else:
        assert err is None
        assert primary.id == want_primary  # type: ignore[union-attr]
        assert secondary.id == want_secondary  # type: ignore[union-attr]
