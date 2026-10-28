---
# the Catalog constructor copies its input array on the way in (the R12 boundary
# clone control) and draws no finding line of its own: catalog.ts may be cited for
# its R2 plant, never as an R12 location
type: regex
pattern: 'catalog\.ts:[0-9]+[^\n]*\bR12\b'
match: not_contains
target: last_message
---
