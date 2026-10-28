---
# recall: the report names at least one file of this plant by basename.
# ids: R1.Q3.tags-loop
type: regex
pattern: '(device_service\.py|heartbeat_parser\.py|tags\.py|sync_service\.py)'
match: contains
target: last_message
---
