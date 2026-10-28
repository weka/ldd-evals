---
# PLW0603 (the global statement rebinding CONFIG) routes to R8 (same line, so
# skill text echoed in tool results cannot satisfy it)
type: regex
pattern: 'PLW0603[^\n]{0,240}\bR8\b'
match: contains
target: trace
---
