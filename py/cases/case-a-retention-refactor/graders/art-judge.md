---
type: llm
criteria: The retention concept now lives in one box with a name, and the code that uses it reads as a story of intent rather than a ledger of parsing and range checks.
focus: { source: files, paths: [internal/snapshot] }
---
Glance at the package as a reader who has never seen it (the concept may now live in a module of its own). Judge the shape,
not the mechanics (tests and lint are graded elsewhere).

PASS only if all four hold, and quote the line that convinces you for each:

1. **One box.** "Retention" is a named thing — a class such as `Retention` or
   `RetentionDays` with its parsing and its 1–365 day rule inside it (a
   `parse` classmethod, a `from_setting` constructor or a `__post_init__` that
   raises), and nothing outside that box re-parses `"d"` suffixes or re-checks
   the range. A bare `_parse_retention_days(raw) -> int` helper shared by both
   callers is a dedupe, not a box: FAIL.
2. **Names speak intent.** The pruning loop asks the retention something in
   domain words — `retention.expired(age)`, `covers(created_at, now)`,
   `allows(sn, now)` or similar — instead of comparing `age > days`. Method
   names that describe mechanics (`check`, `validate`, `get_days`) are FAIL.
3. **One altitude per function.** `apply_policy` (or its successor) reads
   top-down as: obtain the retention, collect what it has expired, return —
   with no arithmetic, `int(...)`, `removesuffix` or unit conversion in that
   body.
4. **No leftover ceremony.** No `0` sentinel meaning "unset", no defensive
   re-check comment, no comment left where the name now says it.

FAIL if either module still contains `int(...removesuffix("d"))` at a call
site outside the retention type, or `days <= 0 or days > 365` in more than
one place.
