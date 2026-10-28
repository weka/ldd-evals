---
type: llm
criteria: undefined and null stopped doing three jobs; every optional or absent thing now has a name, and each of the three modules tells one story at one altitude.
focus: { source: files, paths: [src/features/report] }
---
Glance at the feature folder as a first-time reader (concepts may have moved into modules of their own). Judge shape and naming.

PASS only if all four hold, quoting the convincing line for each:

1. **Absence has a name.** `parseDevice` no longer answers a malformed
   `name/model` line with `null` as if it were blank: a line with no separator,
   no name or no model throws a named error (`MalformedCatalogLine`, an `Error`
   subclass) or the parser returns a small discriminated result; the blank-line
   `null` (a declared absence the caller skips) may stay, as may `find`'s
   `CatalogDevice | undefined`, which tsc checks at every call site. "No sink"
   is a value, not undefined: a null-object sink (`discardSink`, `NopSink`) or
   a private default, so `record` has no undefined check at all. "Default
   clock" is the constructor's business, never re-defaulted inside a method.
2. **The constructor owns the invariants.** `Reporter`'s sink and clock are
   private (`#sink`, `private readonly sink`); `new Reporter(...)` takes what
   it needs (a defaulted parameter or a small options object are both fine)
   and callers never pass `undefined, undefined` to mean "defaults". `wire.ts`
   reads as `new Reporter(sink)` or with a named options object, not
   positional undefineds.
3. **Methods read as sentences.** `record` is one line of intent: stamp the
   event with the clock, hand it to the sink. `Catalog.parse` reads: parse each
   line, keep the devices, skip the blanks — and a broken line stops it with
   the parser's error instead of silently shrinking the catalog.
4. **Comments earn their place.** `/** Reporter is a reporter. */`,
   `/** Where events are written. */` and the `// forget this once and it
   crashes` warning are gone; any remaining comment states a contract the
   name cannot.

FAIL outright if `this.sink === undefined`, `!this.clock`, the malformed-line
`return null` in `parseDevice`, or `new Reporter(sink, undefined, undefined)`
survives anywhere in the three modules.
