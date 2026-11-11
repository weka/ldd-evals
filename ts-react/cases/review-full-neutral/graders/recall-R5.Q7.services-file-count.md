---
# recall: the report names this plant the way its recall_own names it.
# ids: R5.Q7.services-file-count
type: regex
pattern: '(?i:(?:src/services\b|\bservices/)[^\n]*(?:\b15\b[^\n]{0,20}?\bfiles\b|package[ -]size|file[ -]count|limit 13\b)|(?:\b15\b[^\n]{0,20}?\bfiles\b|package[ -]size|file[ -]count)[^\n]*(?:src/services\b|\bservices/))'
match: contains
target: last_message
---
