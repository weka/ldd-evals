---
# recall: the report names the row this leaf's surviving mutant needs, the 64-character row: the table has a 65-character row and no row at the limit.
type: regex
pattern: 'deviceid\.py[^\n]*(?i:\b64\b|max[ _-]?len|length boundary)'
match: contains
target: last_message
---
