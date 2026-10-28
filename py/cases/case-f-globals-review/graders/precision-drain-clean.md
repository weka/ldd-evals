---
# control: `_drain()` is a clean helper and must draw no finding. A finding row is
# `location | rule: evidence | fix | size`; `_drain()` may be named in the evidence
# of a finding about the code around it (the scheduler thread, the sentinels) and
# fails only when it appears in the location column, before the row's first pipe.
type: regex
pattern: '(?m)^[^|\n]*\b_drain\(\)[^|\n]*\|'
match: not_contains
target: last_message
---
