---
# lint-fixer report: the mechanical class is FIXED (B904 raise-from and the
# BLE001/S110 swallowed exception are the surest members); accepts the
# contract's FIXED: line or a FIXED section listing rules
type: regex
pattern: 'FIXED\b.{0,600}(B904|BLE001|S110|raise-without-from|blind-except)'
flags: s
match: contains
target: trace
---
