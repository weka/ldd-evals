---
# control CTRL.R4.private-helper: healthy code that must draw no finding; its symbol must not
# appear anywhere in the report (a mention IS the false positive).
type: regex
pattern: '_parse_clock'
match: not_contains
target: last_message
---
