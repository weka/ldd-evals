---
# sonarjs/cognitive-complexity routes to R3 storifying (same line as the rule id)
type: regex
pattern: 'cognitive-complexity[^\n]{0,240}R3-storifying'
match: contains
target: trace
---
