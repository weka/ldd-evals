"""Wiring of the reporter for one-off announcements."""

from typing import TextIO

from internal.report.catalog import Catalog
from internal.report.reporter import Reporter, Sink


def announce(w: TextIO, catalog_text: str, name: str) -> None:
    """Write the catalog event for name to w, if the catalog text lists the device."""
    sink = Sink(w)
    rep = Reporter(sink, None, None)
    d = Catalog.parse(catalog_text).find(name)
    if d is not None:
        rep.record(d.event())


def summarize(w: TextIO, catalog_text: str) -> None:
    """Write one line per model to w: the model and how many devices the catalog lists for it."""
    by_model = Catalog.parse(catalog_text).models()
    for model in sorted(by_model):
        w.write(f"{model}: {len(by_model[model])}\n")
