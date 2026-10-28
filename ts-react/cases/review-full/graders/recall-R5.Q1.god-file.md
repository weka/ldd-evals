---
# recall: the report names this plant the way its recall_own names it.
# ids: R5.Q1.god-file
type: regex
pattern: 'heartbeatFeed\.ts[^\n]*(?i:[78][0-9]{2}[ -]?(lines?|loc)\b|max-lines|god[ -]file)'
match: contains
target: last_message
---
