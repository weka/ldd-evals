---
# recall: the report names at least one file of this plant by basename.
# ids: R11.Q1.job-kind-if
type: regex
pattern: '(scheduler\.py|snapshot_service\.py|job\.py)'
match: contains
target: last_message
---
