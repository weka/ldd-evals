---
# R8 Q2: the import-time read of REGION (Go's init()) is named: the module-level
# _region, or the words import time / at import
type: regex
pattern: '_region\b|import[- ]time|at import|module import|when the module (is )?(loads|imported)'
flags: i
match: contains
target: last_message
---
