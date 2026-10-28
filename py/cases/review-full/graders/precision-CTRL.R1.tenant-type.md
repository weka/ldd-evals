---
# control CTRL.R1.tenant-type: healthy code that must draw no finding. A correct report may
# name its symbol (as the existing type to wire in, say); it fails only when one of
# its files is cited as a finding location, file:line, in a row that names R1
# (precision: finding).
type: regex
pattern: '(?:^|[^A-Za-z0-9_])(?:tenant\.py):[0-9][^\n|]*\|[^\n|]*\bR1\b'
match: not_contains
target: last_message
---
