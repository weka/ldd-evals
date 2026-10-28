---
# recall: the report names at least one file of this plant by basename.
# ids: R9.Q4.what-comments
type: regex
pattern: '(device\.py|heartbeat\.py|schedule\.py|device_service\.py|notify\.py|cache\.py|trace\.py|reporter\.py|env\.py)'
match: contains
target: last_message
---
