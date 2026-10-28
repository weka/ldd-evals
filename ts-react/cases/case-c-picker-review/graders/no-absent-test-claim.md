---
type: regex
pattern: 'picker\.test\.tsx?\W?\s+(is |was )?(absent|missing|does not exist|doesn.t exist|not found)|\bno picker\.test\.tsx?\b'
flags: i
match: not_contains
target: last_message
---
