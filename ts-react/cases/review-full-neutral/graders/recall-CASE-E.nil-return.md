---
# recall: the report names at least one file of this plant by basename or by the spelling recall_match names.
# ids: CASE-E.nil-return
type: regex
pattern: 'parseDevice|catalog\.ts:(4[8-9]|5[0-9]|6[0-2])\b'
match: contains
target: last_message
---
