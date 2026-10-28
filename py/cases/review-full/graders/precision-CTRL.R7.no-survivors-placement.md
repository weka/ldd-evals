---
# control CTRL.R7.no-survivors-placement: healthy code that must draw no finding. A correct report may
# name its symbol (as the existing type to wire in, say); it fails only when one of
# its files is cited as a finding location, file:line, in a row that names R7
# (precision: finding).
type: regex
pattern: '(?:^|[^A-Za-z0-9_])(?:picker\.py):[0-9][^\n|]*\|[^\n|]*\bR7\b'
match: not_contains
target: last_message
---
