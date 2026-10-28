---
# the one-line _trace helper (trace.py lines 34-40, def to header write) draws no
# finding line of its own
type: regex
pattern: 'handlers/trace\.py:(3[4-9]|40) \|'
match: not_contains
target: last_message
---
