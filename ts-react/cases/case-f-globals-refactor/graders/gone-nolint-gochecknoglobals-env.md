---
# the suppression that let the mutable CONFIG export through (import/no-mutable-exports) is gone from the config module
type: regex
pattern: 'eslint-disable[^\n]*no-mutable-exports'
match: count:0
target: files
---
