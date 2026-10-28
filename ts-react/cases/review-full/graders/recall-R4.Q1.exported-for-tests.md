---
# recall: the report names at least one file of this plant by basename.
# ids: R4.Q1.exported-for-tests
type: regex
pattern: '(heartbeatFeed\.ts|heartbeatFeed\.test\.ts|deviceService\.test\.ts)'
match: contains
target: last_message
---
