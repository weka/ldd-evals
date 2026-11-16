---
type: regex
pattern: 'Deferred( \([^)\n]{0,30}\))?:'
match: contains
target: last_message
---
# The final message prints the ledger line from ldd-ledger.sh show.
