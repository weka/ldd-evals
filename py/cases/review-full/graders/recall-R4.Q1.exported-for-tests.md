---
# recall: the report names at least one file of this plant by basename.
# ids: R4.Q1.exported-for-tests
type: regex
pattern: '(heartbeat_parser\.py|test_service\.py)'
match: contains
target: last_message
---
