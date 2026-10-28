---
# the report names the failed gate, so the script's defect gets a fix
type: regex
pattern: '(?i)gate[^\n]{0,120}fail|fail[^\n]{0,120}gate'
match: contains
target: last_message
---
