---
# the Catalog constructor (catalog.py lines 23-25) copies on the way in and
# draws no finding line of its own
type: regex
pattern: 'report/catalog\.py:2[3-5] \|'
match: not_contains
target: last_message
---
