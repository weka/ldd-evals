---
# recall: the report names at least one file of this plant by basename.
# ids: R1.Q1.settings-blob
type: regex
pattern: '(job\.py|registry\.py|device_service\.py|snapshot_service\.py)'
match: contains
target: last_message
---
