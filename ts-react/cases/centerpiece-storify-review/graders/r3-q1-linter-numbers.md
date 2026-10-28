---
type: regex
pattern: '(heartbeatFeed\.ts:[0-9]+|processHeartbeat).{0,700}(cognitive-complexity|cognitive|cyclomatic|complexity of|max-lines|nested-control-flow|nesting|too (many|deep)|\bLOC\b|\bQ1\b)'
flags: s
match: contains
target: last_message
---
