---
# control CTRL.R10.main-jitter-sleep: healthy code that must draw no finding; its symbol must not
# appear anywhere in the report (a mention IS the false positive).
type: regex
pattern: 'JITTER_MAX_MS|Math\.random'
match: not_contains
target: last_message
---
