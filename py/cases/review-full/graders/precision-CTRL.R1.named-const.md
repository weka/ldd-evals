---
# control CTRL.R1.named-const: healthy code that must draw no finding; its symbol must not
# appear anywhere in the report (a mention IS the false positive).
type: regex
pattern: '_MAX_LEN|_MINUTES_PER_DAY'
match: not_contains
target: last_message
---
