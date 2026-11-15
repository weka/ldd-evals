---
type: regex
pattern: 'envTemplate.{0,300}(R7.{0,6}Q4|\bR4\b)|(R7.{0,6}Q4|\bR4\b).{0,300}envTemplate|R7[^\n]{0,300}envTemplate[^\n]{0,300}Q4'
flags: s
match: contains
target: last_message
---
# recall: the report names the private leaf type and ties it to R7 question 4 (on an R7 row, also after another question) or to R4, within
# 300 characters.
