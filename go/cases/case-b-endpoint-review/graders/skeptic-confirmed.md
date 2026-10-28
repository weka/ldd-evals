---
type: regex
# the skeptic confirmed an extraction, however the report punctuates the verdict
pattern: 'CONFIRMED\W{1,6}score'
match: contains
target: last_message
---
