---
type: regex
pattern: '_expand_env.{0,300}(R7.{0,6}Q4|\bR4\b)|(R7.{0,6}Q4|\bR4\b).{0,300}_expand_env'
flags: s
match: contains
target: last_message
---
# recall: the report names the private leaf and ties it to R7 question 4 or to R4, within 300 characters.
