---
# recall: the report names at least one file of this plant by basename.
# ids: R11.Q1.status-switch
type: regex
pattern: '(status\.py|alert_service\.py|device_service\.py)'
match: contains
target: last_message
---
