---
type: regex
pattern: 'picker_test\.go\W?\s+(is |was )?(absent|missing|does not exist|doesn.t exist|not found)|\bno picker_test\.go\b'
flags: i
match: not_contains
target: last_message
---
