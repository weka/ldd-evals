---
# R8 Q2: the import-time read of the region (Go's init()) is named: the
# module-level region, or the words import time / module scope
type: regex
pattern: '\bregion\b[^\n]{0,80}(import|module|top[- ]level)|import[- ]time|at import|module (import|scope|load)|top[- ]level|when the module (is )?(loads|loaded|imported|evaluated)'
flags: i
match: contains
target: last_message
---
