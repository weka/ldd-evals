---
type: llm
criteria: The orchestrating code in picker.py — pick and whatever helper it delegates to — reads at a single altitude (R3 Q2), every statement a named call or an assignment of one.
focus: { source: file, path: internal/placement/picker.py }
---
Locate `pick` and the method it calls (the replica-picking step, whatever it is
now named). PASS only if, in those bodies, every statement is a named method or
function call, an assignment of one, or a guard clause raising or returning an
error — with NO field comparisons such as `.zone ==` or `.capacity <=`, NO
boolean flags that track progress through a loop, and NO loop over the node
list. Loops and field access are allowed inside methods of a collection type
(for example `class Nodes(list[Node])` with queries returning `Node | None`);
they are not allowed in the orchestrator. A body that still iterates over nodes
and inspects fields, or that keeps `found`-style flags under new names, is FAIL.
