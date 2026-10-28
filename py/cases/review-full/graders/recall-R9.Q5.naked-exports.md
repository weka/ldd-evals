---
# recall: the report names at least one file of this plant by basename.
# ids: R9.Q5.naked-exports
type: regex
pattern: '(alert\.py|job\.py|snapshot\.py|tags\.py|job_kind\.py|validate\.py)'
match: contains
target: last_message
---
