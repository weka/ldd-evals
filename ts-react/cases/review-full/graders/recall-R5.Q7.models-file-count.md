---
# recall: the report names this plant the way its recall_own names it.
# ids: R5.Q7.models-file-count
type: regex
pattern: '(?i:(?:src/types\b|\btypes/)[^\n]*(?:\b17\b[^\n]{0,20}?\bfiles\b|package[ -]size|file[ -]count|limit 13\b)|(?:\b17\b[^\n]{0,20}?\bfiles\b|package[ -]size|file[ -]count)[^\n]*(?:src/types\b|\btypes/))'
match: contains
target: last_message
---
