---
# the goto-shaped retry (a loop with a hand counter and continue) left the body; a named retry helper takes its attempts as a parameter
type: regex
pattern: 'if \(attempt < NOTIFY_ATTEMPTS\)'
match: count:0
target: files
---
