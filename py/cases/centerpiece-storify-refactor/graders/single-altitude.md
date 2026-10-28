---
type: llm
criteria: The new process_heartbeat body reads at a single altitude (R3 Q2) — every statement is a named call or an assignment of one; no string, index or slice manipulation in the body.
focus: { source: file, path: internal/services/device_service.py }
---
Locate the method `process_heartbeat` on `DeviceService` in the FOCUS file. If it
is not defined in this file, FAIL and say so (the method keeps its name and
module; the handler pins it).
PASS only if its body is a short story: parse the line (one call that returns a
heartbeat value or raises), look up or create the device (one call), apply the
status transition (one call), notify on DOWN (one call), score (one call),
persist (one call) — every statement a named call, an assignment of one, or an
early return or raise. FAIL if the body still contains any of: `.split(`,
`.strip(`, `.upper(`, indexing like `parts[0]` or `t[7:]`, string comparisons
against status literals (`== "READY"`), a `for`/`else` dedupe, a `while True`
retry, `time.sleep`, a hand-rolled retry loop, or nested `if` blocks more than
two levels deep. Helper functions elsewhere in the module may contain the
low-level work; only the process_heartbeat body is judged.
