---
type: llm
criteria: The new processHeartbeat body reads at a single altitude (R3 Q2) — every statement is a named call or an assignment of one; no string, index or slice manipulation in the body.
focus: { source: file, path: src/pages/Heartbeats/heartbeatFeed.ts }
---
Locate the function `processHeartbeat` in the FOCUS file. If it is not defined
in this file, FAIL and say so (the function keeps its name and module; the page
imports it from there).
PASS only if its body is a short story: parse the line (one call that returns a
heartbeat value or throws), look up or create the device (one call), apply the
status transition (one call), notify on DOWN (one call), score (one call),
persist (one call) — every statement a named call, an assignment of one, or an
early return or throw. FAIL if the body still contains any of: `.split(`,
`.trim(`, `.toUpperCase(`, indexing like `parts[0]` or `t.slice(7)`, string
comparisons against status literals (`=== 'READY'`), a nested `for…of` with
`continue` de-duplicating tags, a retry loop with a counter, `setTimeout`, a
hand-rolled backoff, or nested `if` blocks more than two levels deep. Helper
functions elsewhere in the module may contain the low-level work; only the
processHeartbeat body is judged.
