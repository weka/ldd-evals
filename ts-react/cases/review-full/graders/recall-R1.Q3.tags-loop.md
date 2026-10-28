---
# recall: the report names at least one file of this plant by basename.
# ids: R1.Q3.tags-loop
type: regex
pattern: '(heartbeatFeed\.ts|tags\.ts|syncService\.ts)'
match: contains
target: last_message
---
