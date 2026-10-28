---
# recall: the report names at least one file of this plant by basename.
# ids: R11.Q1.job-kind-if
type: regex
pattern: '(snapshotService\.ts|job\.ts)'
match: contains
target: last_message
---
