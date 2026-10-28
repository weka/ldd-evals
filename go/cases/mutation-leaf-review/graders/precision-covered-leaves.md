---
type: regex
pattern: '\b(Contains|DaysBetween)\b[^\n]{0,200}\bQ7\b|\bQ7\b[^\n]{0,200}\b(Contains|DaysBetween)\b'
match: not_contains
target: last_message
---
# Every mutant in Contains and DaysBetween is killed on the untouched tree; a Q7
# row on either is an invented survivor.
