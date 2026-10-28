---
type: llm
criteria: Code that was already in its box stayed in its box; nothing was wrapped, layered or renamed for the sake of change. Deleting code nothing referenced is fine; adding structure is not.
focus: { source: files, paths: [src/types, src/pages/Devices] }
---
This case is the negative control. Before the agent touched them,
`src/types/grants.ts` held `Grants` (a small earned type whose methods
`has`/`all` are domain vocabulary; the `RequireWrite` component guards the
pages' mutating actions with `has`) plus the unreferenced `ReplicaCount` and
`Name`, and `src/pages/Devices/trace.ts` held a one-line `withTrace` helper
(and `traceFromSearch`) with a comment stating a real reason (log lines joined
to their request). They already read
like art. The temptation the control measures is *adding* things: an interface,
a wrapper type, an options object, a new module, a rename that adds words.

Look at the two folders as they are now and PASS only if all four hold:

1. **No new indirection.** No interface or abstract class introduced for
   `Grants`, no `TraceId`/`TraceHeader` type wrapping a single string, no
   options object, no builder, no generic helper, no new module in either
   folder that exists to hold structure the old code did not need (the
   Devices page's components and hooks predate the agent and are not new).
   Any of these: FAIL.
2. **Deletion is allowed, growth is not.** `Grants` has a caller and stays;
   if `ReplicaCount` and `Name` are gone because nothing referenced them, that
   is dead-code removal and passes this point. Whatever survives of `Grants`,
   `ReplicaCount` or `Name` must not have grown methods, fields or wrappers.
3. **The trace reason survives.** Whether `withTrace` is still a helper or was
   inlined into its single caller, the explanation of why the header is
   echoed (joining a device's log lines to the request) must still exist in
   substance next to the `X-Trace` header write. A restated-name comment in
   its place, or none, is FAIL.
4. **Names kept or sharpened.** Surviving identifiers (`has`, `all`, `Grants`,
   `withTrace`) mean what they meant. Renames that add words without meaning
   (`hasPermission`, `getAll`, `withTraceHeader`) are FAIL.

Quote the line that decides each point. Anything that made a reader's glance
longer than before is FAIL; anything that made it shorter without adding
structure is PASS.
