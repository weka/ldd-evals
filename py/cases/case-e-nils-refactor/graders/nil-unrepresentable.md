---
type: llm
criteria: After the refactor, None is no longer representable for the Reporter's collaborators (R2 Q1/Q2/Q5/Q6) — not merely rejected.
focus: { source: file, path: internal/report/reporter.py }
---
Answer from the FOCUS file only. PASS requires ALL of:
1. A caller cannot build an invalid Reporter by assignment: the attributes that
   hold the sink and the clock are private (underscore-prefixed, or a frozen
   dataclass) — no public `self.sink: Sink | None` / `self.clock: Clock | None`.
2. The sink and the clock are not `| None` values that the constructor merely
   checks: an absent sink is a real value (a no-op sink object, R11 Null
   Object) or the parameter is a plain non-optional type; the clock has a real
   default value (for example a `system_clock` function or a `SystemClock`
   object) that callers pass explicitly or that a keyword default names.
3. No method of Reporter re-checks its own attributes for None (no `if
   self._sink is None`, `if self._clock is None`), and no constructor branch
   turns a None argument into a default.
4. If nothing in the constructor can fail any more, it does not raise (R2 Fix
   pattern: no error path once nothing can fail). A constructor that applies
   keyword options and raises once on what the options recorded is a
   construction failure, not a None check in a method: it satisfies this item.
The shallow fix — moving `if sink is None: raise` into `__init__` while keeping
`Sink | None` parameters — is FAIL: None is still representable, just rejected.
