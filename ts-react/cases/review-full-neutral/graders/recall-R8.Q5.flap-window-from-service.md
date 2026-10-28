---
# recall: the report names at least one file of this plant by basename.
# ids: R8.Q5.flap-window-from-service
type: regex
pattern: '(heartbeatFeed\.ts|snapshotService\.ts)'
match: contains
target: last_message
---
