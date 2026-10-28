from datetime import UTC, datetime, timedelta

import pytest

from internal.snapshot.schedule import Plan, Window


def _at(hour: int, minute: int) -> datetime:
    return datetime(2024, 3, 1, hour, minute, tzinfo=UTC)


@pytest.mark.parametrize(
    ("start", "end", "inside", "outside", "duration", "text"),
    [
        ("09:00", "17:00", _at(12, 30), _at(17, 0), timedelta(hours=8), "09:00-17:00"),
        ("22:00", "02:00", _at(1, 15), _at(12, 0), timedelta(hours=4), "22:00-02:00"),
        ("03:15", "03:16", _at(3, 15), _at(3, 16), timedelta(minutes=1), "03:15-03:16"),
    ],
)
def test_parse_window_success(
    start: str, end: str, inside: datetime, outside: datetime, duration: timedelta, text: str
) -> None:
    w = Window.parse(start, end)
    assert w.contains(inside)
    assert not w.contains(outside)
    assert w.duration() == duration
    assert str(w) == text


@pytest.mark.parametrize(
    ("start", "end"),
    [("", "17:00"), ("24:00", "17:00"), ("9", "17:00"), ("09:00", "5pm"), ("09:00", "09:00")],
)
def test_parse_window_error(start: str, end: str) -> None:
    with pytest.raises(ValueError, match="window"):
        Window.parse(start, end)


def test_new_plan_copies_windows() -> None:
    night = Window.parse("22:00", "02:00")
    noon = Window.parse("12:00", "13:00")
    windows = [night]

    plan = Plan(windows)
    windows[0] = noon

    assert plan.open(_at(23, 0))
    assert not plan.open(_at(12, 30))
    assert plan.windows() == [night]


def test_new_plan_rejects_no_windows() -> None:
    with pytest.raises(ValueError, match="no windows"):
        Plan([])
