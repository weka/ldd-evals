---
# recall: the report names at least one file of this plant by basename.
# ids: R12.Q1.leaked-internals
type: regex
pattern: '(cache\.ts|grants\.ts|schedule\.ts|snapshotService\.ts)'
match: contains
target: last_message
---
