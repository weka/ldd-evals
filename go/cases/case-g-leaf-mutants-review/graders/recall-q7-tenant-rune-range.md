---
# recall: the report names the row this leaf's surviving mutant needs, the rune-range rows: z, 0 and 9 sit on the range edges.
type: regex
pattern: 'tenant(_test)?\.go[^\n]*(?i:''[z09]''|\b[z09]\b|range|boundary)'
match: contains
target: last_message
---
