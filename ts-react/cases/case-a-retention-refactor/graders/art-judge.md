---
type: llm
criteria: The retention concept now lives in one box with a name, and the code that uses it reads as a story of intent rather than a ledger of parsing and range checks.
focus: { source: files, paths: [src/features/snapshot] }
---
Glance at the feature folder as a reader who has never seen it (the concept may now live in a module of its own). Judge the shape,
not the mechanics (tests and lint are graded elsewhere).

PASS only if all four hold, and quote the line that convinces you for each:

1. **One box.** "Retention" is a named thing — a class or a branded type such as
   `Retention` or `RetentionDays` with its parsing and its 1–365 day rule inside
   it (a `parse` function or static, a `from(setting)` constructor or a
   constructor that throws), and nothing outside that box re-parses `"d"`
   suffixes or re-checks the range. A bare `retentionDays(raw): number` helper
   shared by both callers is a dedupe, not a box: FAIL.
2. **Names speak intent.** The pruning loop asks the retention something in
   domain words — `retention.expired(age)`, `covers(createdAt, now)`,
   `allows(snapshot, now)` or similar — instead of comparing `age > days`. Method
   names that describe mechanics (`check`, `validate`, `getDays`) are FAIL.
3. **One altitude per function.** `applyPolicy` (or its successor) reads
   top-down as: obtain the retention, collect what it has expired, return —
   with no arithmetic, `Number(...)`, `parseInt`, suffix stripping or unit
   conversion in that body.
4. **No leftover ceremony.** No `0` sentinel meaning "unset", no defensive
   re-check comment, no comment left where the name now says it.

FAIL if either module still strips the `"d"` suffix at a call site outside the
retention type, or checks `days <= 0 || days > 365` in more than one place.
