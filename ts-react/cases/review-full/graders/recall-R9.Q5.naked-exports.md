---
# recall: the report names at least one file of this plant by basename.
# ids: R9.Q5.naked-exports
type: regex
pattern: '(alert\.ts|job\.ts|snapshot\.ts|tags\.ts|jobKind\.ts|validate\.ts)'
match: contains
target: last_message
---
