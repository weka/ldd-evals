---
type: regex
pattern: '__testing|testing_exports|_expand_env = expand_env|expand_env = _expand_env'
match: not_contains
target: last_message
---
# The fix is never a door that exports the private name for tests only.
