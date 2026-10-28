---
type: llm
criteria: Code that was already in its box stayed in its box; nothing was wrapped, layered or renamed for the sake of change. Deleting code nothing referenced is fine; adding structure is not.
focus: { source: files, paths: [internal/models, internal/handlers] }
---
This case is the negative control. Before the agent touched them,
`internal/models/grants.py` held `Grants` (a small earned type whose methods
`has`/`all` are domain vocabulary; `require_write` in
`internal/handlers/authz.py` guards the mutating routes with `has`) plus the
unreferenced `ReplicaCount` and `Name`, and `internal/handlers/trace.py` held a
one-line `_trace` helper with a docstring stating a real reason (log lines
joined to their request). They already read like art. The temptation the
control measures is *adding* things: a Protocol, a wrapper type, an options
dataclass, a new package, a rename that adds words.

Look at the two packages as they are now and PASS only if all four hold:

1. **No new indirection.** No Protocol or ABC introduced for `Grants` or
   `Handler`, no `TraceId`/`TraceHeader` type wrapping a single string, no
   options dataclass, no builder, no generic helper, no new module in either
   package that exists to hold structure the old code did not need
   (`authz.py` and its `require_write` predate the agent and are not new).
   Any of these: FAIL.
2. **Deletion is allowed, growth is not.** `Grants` has a caller and stays;
   if `ReplicaCount` and `Name` are gone because nothing referenced them, that
   is dead-code removal and passes this point. Whatever survives of `Grants`,
   `ReplicaCount` or `Name` must not have grown methods, fields or wrappers.
3. **The trace reason survives.** Whether `_trace` is still a helper or was
   inlined into its single caller, the explanation of why the header is
   echoed (joining a device's log lines to the request) must still exist in
   substance next to the `X-Trace` header write. A restated-name docstring in
   its place, or none, is FAIL.
4. **Names kept or sharpened.** Surviving identifiers (`has`, `all`, `Grants`,
   `routes`, `list_devices`, `Handler`) mean what they meant. Renames that add
   words without meaning (`has_permission`, `get_all`, `trace_request`) are
   FAIL.

Quote the line that decides each point. Anything that made a reader's glance
longer than before is FAIL; anything that made it shorter without adding
structure is PASS.
