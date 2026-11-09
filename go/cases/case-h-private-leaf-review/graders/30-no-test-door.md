---
type: regex
pattern: 'export_test|__testing|var ExpandEnv = expandEnv'
match: not_contains
target: last_message
---
# The fix is never a door that exports the private name for tests only.
