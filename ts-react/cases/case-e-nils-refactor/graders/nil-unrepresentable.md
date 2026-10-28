---
type: llm
criteria: After the refactor, undefined is no longer representable for the Reporter's collaborators (R2 Q1/Q2/Q5/Q6) — not merely rejected.
focus: { source: file, path: src/features/report/reporter.ts }
---
Answer from the FOCUS file only. PASS requires ALL of:
1. A caller cannot build an invalid Reporter by assignment: the fields that
   hold the sink and the clock are private (`#sink`, `private readonly`) — no
   public `sink?: Sink` / `clock: Clock | undefined`.
2. The sink and the clock are not `| undefined` values that the constructor
   merely checks: an absent sink is a real value (a no-op sink object, R11 Null
   Object) or the parameter is a plain non-optional type; the clock has a real
   default value (for example a `systemClock` function or a `SystemClock`
   object) that callers pass explicitly or that a parameter default names.
3. No method of Reporter re-checks its own fields for undefined (no `if
   (!this.sink)`, `this.clock ?? `, `this.sink?.write`), and no constructor
   branch turns an undefined argument into a default.
4. If nothing in the constructor can fail any more, it does not throw (R2 Fix
   pattern: no error path once nothing can fail). A constructor that applies
   options and throws once on what the options recorded is a construction
   failure, not an undefined check in a method: it satisfies this item.
The shallow fix — moving `if (!sink) throw` into the constructor while keeping
`sink?: Sink` parameters — is FAIL: undefined is still representable, just
rejected.
