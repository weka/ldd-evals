---
type: regex
pattern: 'test_picker\.py\W?\s+(is |was )?(absent|missing|does not exist|doesn.t exist|not found)|\bno test_picker\.py\b'
flags: i
match: not_contains
target: last_message
---
