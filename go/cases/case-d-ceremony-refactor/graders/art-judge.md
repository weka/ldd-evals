---
type: llm
criteria: Code that was already in its box stayed in its box; nothing was wrapped, layered or renamed for the sake of change. Deleting code nothing referenced is fine; adding structure is not.
focus: { source: files, paths: [internal/models, internal/handlers] }
---
This case is the negative control. Before the agent touched them,
`internal/models/grants.go` held `Grants` (a small earned type whose methods
`Has`/`All` are domain vocabulary; `requireWrite` in
`internal/handlers/authz.go` guards the mutating routes with `Has`) plus the
unreferenced `ReplicaCount` and `Name`, and `internal/handlers/trace.go` held,
as given: the `Handler` struct over the store, its `NewHandler` constructor, its
`List` handler, a one-line `trace` method with a comment stating a real reason
(log lines joined to their request), and `Routes`, which builds the `Handler`
and mounts it. Every one of those is the fixture's, not the agent's, and is not
new structure. They already read like art. The temptation the control measures
is *adding* things: an interface, a wrapper type, an options struct, a new
package, a rename that adds words.

Look at the two packages as they are now and PASS only if all four hold:

1. **No new indirection.** No interface introduced for `Grants` or `Handler`,
   no `TraceID`/`TraceHeader` type wrapping a single string, no options
   struct, no builder, no generic helper, no new file in either package that
   exists to hold structure the old code did not need (`authz.go` and its
   `requireWrite` predate the agent and are not new; so do `Handler`,
   `NewHandler`, `List` and `Routes` in `trace.go` — judge only what was added
   beside them). Any of these: FAIL.
2. **Deletion is allowed, growth is not.** `Grants` has a caller and stays;
   if `ReplicaCount` and `Name` are gone because nothing referenced them, that
   is dead-code removal and passes this point. Whatever survives of `Grants`,
   `ReplicaCount` or `Name` must not have grown methods, fields or wrappers.
3. **The trace reason survives.** Whether `trace` is still a helper or was
   inlined into its single caller, the comment explaining why the header is
   echoed (joining a device's log lines to the request) must still exist in
   substance next to the `X-Trace` header write. A restated-name comment in
   its place, or no comment, is FAIL.
4. **Names kept or sharpened.** Surviving identifiers (`Has`, `All`,
   `NewGrants`, `Routes`, `List`, `NewHandler`) mean what they meant. Renames
   that add words without meaning (`HasPermission`, `GetAll`, `traceRequest`)
   are FAIL.

Quote the line that decides each point. Anything that made a reader's glance
longer than before is FAIL; anything that made it shorter without adding
structure is PASS.
