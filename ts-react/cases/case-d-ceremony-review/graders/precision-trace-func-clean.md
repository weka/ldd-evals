---
# the one-line trace helper is the control: its file draws no finding line of its
# own. A finding row is `location | rule: evidence | fix | size`; the file may be
# named in prose and fails only when it is cited as a finding location.
type: regex
pattern: 'Devices/trace\.ts:[0-9]+ \|'
match: not_contains
target: last_message
---
