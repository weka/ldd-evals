---
# recall: the report names at least one file of this plant by basename.
# ids: R11.Q1.status-switch
type: regex
pattern: '(StatusPage\.tsx|alertService\.ts|heartbeatFeed\.ts)'
match: contains
target: last_message
---
