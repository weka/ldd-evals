---
# recall: the report names at least one file of this plant by basename.
# ids: R9.critic.caller-must, R2.Q4.caller-must-comments
type: regex
pattern: '(heartbeat\.ts|heartbeatFeed\.ts)'
match: contains
target: last_message
---
