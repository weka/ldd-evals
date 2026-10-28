---
# recall: the report names the row this leaf's surviving mutant needs, slugify's separator rows: no row starts or ends with a separator.
type: regex
pattern: 'strings(\.test)?\.ts[^\n]*(?i:leading|trailing|separator|dash|hyphen|out\.length)'
match: contains
target: last_message
---
