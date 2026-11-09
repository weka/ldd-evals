---
# control CTRL.R4.trivial-private-in-io: healthy code that must draw no finding; its symbol must not
# appear anywhere in the report (a mention IS the false positive).
type: regex
pattern: '_trim_slash'
match: not_contains
target: last_message
---
