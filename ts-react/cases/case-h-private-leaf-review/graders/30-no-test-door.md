---
type: regex
pattern: '__testing|ForTesting|exportedForTest|testOnlyExport'
match: not_contains
target: last_message
---
# The fix is never a door that exports the private name for tests only.
