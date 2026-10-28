---
# recall: the report names at least one file of this plant by basename.
# ids: R8.Q3.context-background-in-service
type: regex
pattern: '(device_service\.py|sync_service\.py|registry\.py)'
match: contains
target: last_message
---
