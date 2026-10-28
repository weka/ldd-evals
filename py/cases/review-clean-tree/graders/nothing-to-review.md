---
# the bare command on a clean tree with no base branch reaches the last rung of the
# scope ladder and says so
type: regex
pattern: '(?i)nothing (to|in scope to) (review|analy[sz]e)|no files? (in scope|to review)|scope[^\n]{0,40}\b(empty|none)\b'
match: contains
target: last_message
---
