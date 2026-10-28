---
type: regex
pattern: 'Stop check.*?^\W{0,6}1\W{1,6}gates\b.*?^\W{0,6}2\W{1,6}re-run\b.*?^\W{0,6}3\W{1,6}nouns?\b.*?^\W{0,6}4\W{1,6}critic\b.*?^\W{0,6}5\W{1,6}STOP\b.*?^\W{0,6}6\W{1,6}commit\b'
flags: ims
match: contains
target: last_message
---
The refactoring skill's exit is its `Stop check` block: six lines, each opening with
the step number and keyword (`1 gates`, `2 re-run`, `3 nouns`, `4 critic`, `5 STOP`,
`6 commit`), copied verbatim into the message that ends the turn whichever path
invoked the skill — standalone, the workflow's ship summary or quickfix's. The pattern
reads those six openings in order, each at the start of a line (markdown around the
opening is tolerated: `1.`, `**gates**`, an em dash), and lets a line's result wrap
onto indented continuation lines; it fails a prose account of the steps, a block
missing a line, and a run that never rendered the block. Checked against the
go-2.11.0-c78b55f traces (case-e passes, the other six refactor runs fail) and the
first stop-check measurement (rendered blocks pass, a turn-capped run with no final
message fails).
