---
# recall: CLAUDE.md does not import docs/index.md — the anchor, then Q3 nearby
type: regex
pattern: 'CLAUDE\.md.{0,500}Q3|Q3.{0,500}CLAUDE\.md'
flags: s
match: contains
target: last_message
---
