---
# recall: the report names at least one file of this plant by basename.
# ids: R9.Q4.what-comments
type: regex
pattern: '(device\.ts|heartbeat\.ts|schedule\.ts|heartbeatFeed\.ts|notify\.ts|cache\.ts|reporter\.ts|env\.ts|alertService\.ts|snapshotService\.ts|syncService\.ts)'
match: contains
target: last_message
---
