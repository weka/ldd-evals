---
# control CTRL.R11.value-conditional: healthy code that must draw no finding; its symbol must not
# appear anywhere in the report (a mention IS the false positive).
type: regex
pattern: 'self\.start < self\.end'
match: not_contains
target: last_message
---
