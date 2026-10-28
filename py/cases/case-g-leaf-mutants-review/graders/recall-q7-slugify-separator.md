---
# recall: the report names the row this leaf's surviving mutant needs, slugify's separator rows: no row ends with a separator.
type: regex
pattern: 'utils\.py[^\n]*(?i:leading|trailing|separator|dash|hyphen|removesuffix)'
match: contains
target: last_message
---
