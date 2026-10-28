---
# recall: the report names at least one file of this plant by basename.
# ids: R1.Q3.region-byte-slices
type: regex
pattern: '(device_service\.py|heartbeat_parser\.py|tags\.py)'
match: contains
target: last_message
---
