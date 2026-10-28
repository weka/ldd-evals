---
type: regex
# the skeptic confirmed an extraction at 4 or more, however the report punctuates
# the verdict ("CONFIRMED (score 5", "**CONFIRMED** (score 5", "CONFIRMED, score 8")
pattern: 'CONFIRMED\W{1,6}score:? ?([4-9]|1[0-9])'
match: contains
target: last_message
---
