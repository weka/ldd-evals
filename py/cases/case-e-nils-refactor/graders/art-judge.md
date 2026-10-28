---
type: llm
criteria: None stopped doing three jobs; every optional or absent thing now has a name, and each of the three modules tells one story at one altitude.
focus: { source: files, paths: [internal/report] }
---
Glance at the package as a first-time reader (concepts may have moved into modules of their own). Judge shape and naming.

PASS only if all four hold, quoting the convincing line for each:

1. **Absence has a name.** `find` no longer returns `None`: it raises a named
   exception (`UnknownDevice`, a `LookupError` subclass) or returns a
   `(Device, bool)` pair or a small result type. "No sink" is a value, not
   None: a null-object sink (`DiscardSink`, `NopSink`) or a private default,
   so `record` has no None check at all. "Default clock" is the constructor's
   business, never re-defaulted inside a method.
2. **The constructor owns the invariants.** `Reporter`'s sink and clock are
   private; `Reporter(...)` takes what it needs (keyword defaults or a small
   options dataclass are both fine) and callers never pass `None, None` to
   mean "defaults". `wire.py` reads as `Reporter(Sink(w))` or with named
   keywords, not positional Nones.
3. **Methods read as sentences.** `record` is one line of intent: stamp the
   event with the clock, hand it to the sink. `announce` reads: find the
   device, and if known, record its event — with an exception or a pair, not
   `is not None` on the result.
4. **Docstrings earn their place.** `"""Reporter is a reporter."""`,
   `"""Where events are written."""` and the `# forget this once and it
   crashes` warning are gone; any remaining comment states a contract the
   name cannot.

FAIL outright if `self.sink is None`, `self.clock is None`, `return None` in
`find`, or `Reporter(sink, None, None)` survives anywhere in the three modules.
