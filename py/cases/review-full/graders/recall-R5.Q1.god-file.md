---
# recall: the report names this plant the way its recall_own names it.
# ids: R5.Q1.god-file
type: regex
pattern: 'device_service\.py[^\n]*(?i:4[5-9][0-9][ -]?(lines?|loc)\b|god[ -]file|longest)'
match: contains
target: last_message
---
