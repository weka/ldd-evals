---
# a whole-repository review leaves the mutant question (R7 Q7) to scoped
# reviews: the report says Q7 is per-leaf, not judged on --all.
type: regex
pattern: 'R7 Q7[^\n]*(?i:per-leaf)'
match: contains
target: last_message
---
