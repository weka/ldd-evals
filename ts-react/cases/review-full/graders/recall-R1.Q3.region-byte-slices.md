---
# recall: the report names at least one file of this plant by basename.
# ids: R1.Q3.region-byte-slices
type: regex
pattern: '(heartbeatFeed\.ts|tags\.ts)'
match: contains
target: last_message
---
