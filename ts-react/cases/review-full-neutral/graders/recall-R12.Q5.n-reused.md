---
# recall: the report names at least one file of this plant by basename.
# ids: R12.Q5.n-reused
type: regex
pattern: '(heartbeatFeed\.ts|cache\.ts)'
match: contains
target: last_message
---
