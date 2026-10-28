---
type: regex
pattern: 'tenant(_test)?\.go:[0-9]+.{0,500}\bQ7\b'
flags: s
match: contains
target: last_message
---
# isTenantRune's ranges have no row at z, 0 or 9.
