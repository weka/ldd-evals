---
# recall: the report names at least one file of this plant by basename.
# ids: R1.Q8.retention-raw-map
type: regex
pattern: '(config\.ts|policy\.ts|scheduler\.ts)'
match: contains
target: last_message
---
