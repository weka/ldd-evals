---
# recall: the report names at least one file of this plant by basename.
# ids: R8.Q1.registry-globals
type: regex
pattern: '(registry\.ts|apiQueryClient\.ts|apiClient\.ts)'
match: contains
target: last_message
---
