---
# recall: the report names the row this leaf's surviving mutant needs, the empty-tenant message: toThrow('tenant') accepts any message holding the word.
type: regex
pattern: 'tenant(\.test)?\.ts[^\n]*(?i:tenant: empty|toThrow|message)'
match: contains
target: last_message
---
