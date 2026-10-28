---
# the public undefined-able fields are routed to constructor ownership: a validating
# constructor, hoisted checks, or (for the optional collaborators) the Null Object
# default the constructor supplies; the report may describe the move as making
# the fields private and defaulting them in the constructor
type: regex
pattern: '(?i)validating constructor|hoist[^\n]{0,40}(check|default)|null[- ]?object|privati[sz]e|private (readonly )?(the |field|sink|clock|#)|fields private|#sink|readonly|parameter default|default parameter|options object'
match: contains
target: last_message
---
