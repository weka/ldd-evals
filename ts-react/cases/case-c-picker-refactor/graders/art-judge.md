---
type: llm
criteria: The node list became a collection type that answers placement questions by name, and pick reads as a two-line story instead of a flag-driven loop.
focus: { source: files, paths: [src/pages/Devices/placement] }
---
Glance at the folder as a first-time reader. The single-altitude grader already
checks the orchestrator body; you judge whether the whole module now reads as
art.

PASS only if all four hold, quoting the convincing line for each:

1. **The collection has a name.** Something like `class Nodes` (or `Fleet`,
   `Candidates`, a class wrapping `readonly Node[]`) exists and owns the
   walking: methods such as `usable()`, `inZone(zone)`, `outsideZone(zone)`,
   `first()` returning `Node | undefined`. A loop that still lives in the
   picker with flags renamed is FAIL.
2. **The node knows its own health.** "Empty zone or non-positive capacity
   means unusable" is stated once, as a method, getter or predicate on `Node`
   (`usable`, `healthy`), not as an inline predicate in the picker.
3. **pick tells the story.** Its body reads roughly: primary = usable nodes
   in the zone, first; secondary = usable nodes outside the zone, first;
   error if either is missing. Each step a named call. No `primaryFound`
   style booleans anywhere in the module.
4. **Names and JSDoc earn their place.** No `/** Placer is a placer. */`
   style restatements remain; the module comment says why placement spreads
   replicas across zones. Method names are domain words, not `helper`,
   `process`, `do`, `check`.

FAIL outright if `primaryFound`, `secondaryFound` or any `found` flag
survives, or if the replica-picking step still iterates over the list with
nested `if`.
