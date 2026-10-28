---
# recall: the report names at least one file of this plant by basename.
# ids: R5.Q1.models-red-zone
type: regex
pattern: '(device\.ts|alert\.ts|job\.ts)'
match: contains
target: last_message
---
