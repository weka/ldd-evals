---
# control CTRL.R10.repo-mutex: healthy code that must draw no finding; its symbol must not
# appear anywhere in the report (a mention IS the false positive).
type: regex
pattern: '_guard\b'
match: not_contains
target: last_message
---
