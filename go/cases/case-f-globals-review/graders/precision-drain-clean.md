---
# control: `drain()` is a clean helper and must draw no finding. A finding row is
# `location | rule: evidence | fix | size`; `drain()` may be named in the evidence
# of a finding about the code around it (the scheduler goroutine, the sentinels) and
# fails only when it appears in the location column, before the row's first pipe.
type: regex
pattern: '(?m)^[^|\n]*\bdrain\(\)[^|\n]*\|'
match: not_contains
target: last_message
---
