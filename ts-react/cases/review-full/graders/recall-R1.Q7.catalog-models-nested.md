---
# recall: the report names at least one file of this plant by basename.
# ids: R1.Q7.catalog-models-nested
type: regex
pattern: '(catalog\.ts|wire\.ts)'
match: contains
target: last_message
---
