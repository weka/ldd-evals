---
# hunter evidence protocol: every finding line is `R<N> | file:line | …`
type: regex
pattern: '\.py:[0-9]+'
match: contains
target: last_message
---
