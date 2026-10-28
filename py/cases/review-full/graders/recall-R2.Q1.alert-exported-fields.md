---
# recall: the report names at least one file of this plant by basename.
# ids: R2.Q1.alert-exported-fields
type: regex
pattern: '(alert\.py|alert_service\.py)'
match: contains
target: last_message
---
