---
# recall: the report names this plant the way its recall_own names it.
# ids: R5.Q7.models-file-count
type: regex
pattern: '(?i:\bmodels\b[^\n]*(?:\b14\b[^\n]{0,20}?\b(?:files|modules)\b|package[ -]size|file[ -]count|limit 13\b)|(?:\b14\b[^\n]{0,20}?\b(?:files|modules)\b|package[ -]size|file[ -]count)[^\n]*\bmodels\b)'
match: contains
target: last_message
---
