---
# recall: the report names at least one file of this plant by basename.
# ids: R1.Q5.heartbeat-clump
type: regex
pattern: '(heartbeatFeed\.ts|simulateRequest\.ts)'
match: contains
target: last_message
---
