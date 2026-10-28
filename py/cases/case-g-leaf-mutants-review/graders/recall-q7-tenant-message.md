---
# recall: the report names the row this leaf's surviving mutant needs, the empty-tenant message: match="tenant" accepts any message holding the word.
type: regex
pattern: 'tenant\.py[^\n]*(?i:tenant: empty|match=|message)'
match: contains
target: last_message
---
