---
# recall: the report names at least one file of this plant by basename.
# ids: R12.Q1.leaked-internals
type: regex
pattern: '(cache\.py|grants\.py|schedule\.py|snapshot_service\.py)'
match: contains
target: last_message
---
