---
type: regex
pattern: '_?EnvTemplate.{0,300}(R7.{0,6}Q4|\bR4\b)|(R7.{0,6}Q4|\bR4\b).{0,300}_?EnvTemplate|R7[^\n]{0,300}_?EnvTemplate[^\n]{0,300}Q4'
flags: s
match: contains
target: last_message
---
# recall: the report names the private leaf type and ties it to R7 question 4 (on an R7 row, also after another question) or to R4, within
# 300 characters.
