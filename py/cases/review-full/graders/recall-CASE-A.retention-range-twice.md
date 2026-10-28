---
# recall: the report names at least one file of this plant by basename.
# ids: CASE-A.retention-range-twice
type: regex
pattern: '(policy\.py|config\.py)'
match: contains
target: last_message
---
