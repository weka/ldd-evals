---
type: regex
pattern: '(device_service\.py:[0-9]+|process_heartbeat).{0,700}(C901|complexipy|cognitive|radon|cyclomatic|PLR091[125]|too many (branches|statements|returns)|nesting levels|\bLOC\b|\bQ1\b)'
flags: s
match: contains
target: last_message
---
