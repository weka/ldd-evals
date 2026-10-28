---
type: regex
pattern: 'CONFIRMED\W{1,6}score[^\n]*(class Version\b|Version type|Version wrapper|Version\(str\)|Domain Type:? ?`?Version\b)'
match: not_contains
target: last_message
---
