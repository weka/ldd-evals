---
# The report cites the private `_dial` helper as evidence: the port re-check and the
# (host, port, tls) clump both live there. Reports write `_dial` with or without the
# call parentheses.
type: regex
pattern: '\b_dial\b'
match: contains
target: last_message
---
