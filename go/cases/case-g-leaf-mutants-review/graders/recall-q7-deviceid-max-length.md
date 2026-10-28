---
# recall: the report names the row this leaf's surviving mutant needs, the 64-character row that kills the > to >= mutant.
type: regex
pattern: 'deviceid(_test)?\.go[^\n]*(?i:\b64\b|max[ _-]?len|length boundary)'
match: contains
target: last_message
---
