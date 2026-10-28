---
type: regex
pattern: 'deviceid(_test)?\.go:[0-9]+.{0,500}\bQ7\b'
flags: s
match: contains
target: last_message
---
# Parse's `len(raw) > maxLen` has no 64-char row beside it: a Q7 finding anchored
# in deviceid.go or its table.
