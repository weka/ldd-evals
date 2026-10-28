---
# the exported nil-able fields are routed to constructor ownership: a validating
# constructor, hoisted checks, or (for the optional collaborators) the Null Object
# default the constructor supplies; the report may describe the move as
# privatizing the fields and defaulting them in NewReporter
type: regex
pattern: '(?i)validating constructor|hoist[^\n]{0,40}(check|default)|null[- ]?object|privati[sz]e|private the|fields private|unexport|underscore|__post_init__|keyword-only'
match: contains
target: last_message
---
