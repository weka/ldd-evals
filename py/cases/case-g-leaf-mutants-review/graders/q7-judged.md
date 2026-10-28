---
# a scoped review judges R7 Q7; only a whole-repository review may leave it per-leaf.
type: regex
pattern: 'R7 Q7:[^\n]*per-leaf, not judged'
match: not_contains
target: last_message
---
