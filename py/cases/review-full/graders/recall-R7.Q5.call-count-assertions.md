---
# recall: the report names at least one file of this plant by basename.
# ids: R7.Q5.call-count-assertions
type: regex
pattern: '(test_heartbeat\.py|test_scheduler\.py)'
match: contains
target: last_message
---
