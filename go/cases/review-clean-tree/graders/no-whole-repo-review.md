---
# the report never claims to have reviewed the repository: no CLUSTER entry and no
# per-rule finding tally, which only a whole-repository run would produce here
type: regex
pattern: '(?i)\bcluster\b|\bR[0-9]{1,2}: [0-9]+ finding'
match: not_contains
target: last_message
---
