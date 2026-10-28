---
# The report cites the base-URL builder as evidence: the scheme choice and the
# (host, port, tls) clump both live there. Reports write the function by name or
# the concept by its words.
type: regex
pattern: '\b(build|make|to)?[bB]ase[Uu]rl\b|base URL'
match: contains
target: last_message
---
