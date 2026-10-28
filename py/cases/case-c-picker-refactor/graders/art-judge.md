---
type: llm
criteria: The node list became a collection type that answers placement questions by name, and pick reads as a two-line story instead of a flag-driven loop.
focus: { source: files, paths: [internal/placement] }
---
Glance at the package as a first-time reader. The single-altitude grader already
checks the orchestrator body; you judge whether the whole module now reads as
art.

PASS only if all four hold, quoting the convincing line for each:

1. **The collection has a name.** Something like `class Nodes(list[Node])` (or
   `Fleet`, `Candidates`, a dataclass wrapping `list[Node]`) exists and owns
   the walking: methods such as `usable()`, `in_zone(zone)`,
   `outside_zone(zone)`, `first()` returning `Node | None`. A loop that still
   lives in the placer with flags renamed is FAIL.
2. **The node knows its own health.** "Empty zone or non-positive capacity
   means unusable" is stated once, as a method or property on `Node`
   (`usable`, `healthy`), not as an inline predicate in the picker.
3. **pick tells the story.** Its body reads roughly: primary = usable nodes
   in the zone, first; secondary = usable nodes outside the zone, first;
   error if either is missing. Each step a named call. No `primary_found`
   style booleans anywhere in the module.
4. **Names and docstrings earn their place.** No `"""Placer is a placer."""`
   style restatements remain; the module docstring says why placement spreads
   replicas across zones. Method names are domain words, not `helper`,
   `process`, `do`, `check`.

FAIL outright if `primary_found`, `secondary_found` or any `found` flag
survives, or if `_pick_replicas` still iterates over the list with nested `if`.
