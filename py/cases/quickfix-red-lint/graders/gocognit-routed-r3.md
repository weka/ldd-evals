---
# C901 routes to R3 storifying (same line as the rule code)
type: regex
pattern: 'C901[^\n]{0,240}R3-storifying'
match: contains
target: trace
---
