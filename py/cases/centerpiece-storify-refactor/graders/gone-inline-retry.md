---
# the goto-shaped retry (a while True with a hand counter and continue) left the body; a named retry helper takes its attempts as a parameter
type: regex
pattern: 'attempt < 3'
match: count:0
target: files
---
