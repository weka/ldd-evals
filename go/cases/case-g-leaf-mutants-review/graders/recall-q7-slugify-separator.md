---
# recall: the report names the row this leaf's surviving mutant needs, the leading-separator row: Slugify("#12") == "12".
type: regex
pattern: '(strings|utils_test)\.go[^\n]*(?i:leading|separator|dash|hyphen|b\.Len|#12)'
match: contains
target: last_message
---
