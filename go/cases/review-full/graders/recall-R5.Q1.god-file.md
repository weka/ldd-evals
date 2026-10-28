---
# recall: the report names this plant the way its recall_own names it.
# ids: R5.Q1.god-file
type: regex
pattern: 'device_service\.go[^\n]*(?i:6[0-9]{2}[ -]?(lines?|loc)\b|file-length|god[ -]file)'
match: contains
target: last_message
---
