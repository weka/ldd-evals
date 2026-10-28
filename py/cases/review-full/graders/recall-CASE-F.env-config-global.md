---
# recall: the report names at least one file of this plant by basename or by the spelling recall_match names.
# ids: CASE-F.env-config-global, CASE-F.region-read-in-init
type: regex
pattern: 'env\.py|env\.CONFIG|\bCONFIG\b'
match: contains
target: last_message
---
