import io
from datetime import UTC, datetime, timedelta

from internal.report.catalog import Catalog, Device
from internal.report.reporter import Event, Options, Reporter, Sink
from internal.report.wire import announce, summarize


def _fixed_clock() -> datetime:
    return datetime(2024, 3, 1, 12, tzinfo=UTC)


def test_reporter_record_stamps_with_clock() -> None:
    buf = io.StringIO()
    rep = Reporter(Sink(buf), _fixed_clock, Options(flush_every=timedelta(minutes=1)))

    rep.record(Event(kind="boot", subject="dev-1"))

    assert buf.getvalue() == "2024-03-01T12:00:00Z boot dev-1\n"
    assert rep.flush_interval() == timedelta(minutes=1)


def test_reporter_defaults_when_unset() -> None:
    buf = io.StringIO()
    rep = Reporter(Sink(buf), None, None)

    rep.record(Event(kind="boot", subject="dev-1"))

    assert buf.getvalue()
    assert rep.flush_interval() == timedelta(0)


def test_reporter_without_sink_drops_events() -> None:
    rep = Reporter(None, _fixed_clock, None)

    rep.record(Event(kind="boot", subject="dev-1"))  # must not raise

    assert rep.sink is None


def test_event_at() -> None:
    ev = Event(kind="boot", subject="").at(_fixed_clock())
    assert ev.time() == _fixed_clock()


def test_catalog_find_known_device() -> None:
    cat = Catalog([Device(name="dev-1", model="m1"), Device(name="dev-2", model="m2")])

    d = cat.find("dev-2")
    assert d is not None
    assert d.model == "m2"


def test_catalog_find_unknown_device() -> None:
    cat = Catalog([Device(name="dev-1", model="m1")])
    assert cat.find("dev-9") is None


def test_catalog_parse_skips_blank_lines() -> None:
    cat = Catalog.parse("dev-1/m1\n\ndev-2/m2\n")

    assert cat.find("dev-2") == Device(name="dev-2", model="m2")


def test_summarize_counts_devices_per_model() -> None:
    buf = io.StringIO()

    summarize(buf, "dev-1/m2\ndev-2/m1\ndev-3/m2\n")

    assert buf.getvalue() == "m1: 1\nm2: 2\n"


def test_announce_writes_known_device() -> None:
    buf = io.StringIO()
    text = "dev-1/m1\n"

    announce(buf, text, "dev-1")
    announce(buf, text, "dev-9")

    assert buf.getvalue().endswith(" catalog dev-1/m1\n")
    assert buf.getvalue().count("\n") == 1
