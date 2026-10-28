---
type: regex
pattern: 'CONFIRMED\W{1,6}score[^\n]*TraceID'
match: not_contains
target: last_message
---
