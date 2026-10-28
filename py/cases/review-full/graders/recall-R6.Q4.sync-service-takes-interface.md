---
# recall: the report names at least one file of this plant by basename.
# ids: R6.Q4.sync-service-takes-interface
type: regex
pattern: '(sync_service\.py|snapshot_service\.py)'
match: contains
target: last_message
---
