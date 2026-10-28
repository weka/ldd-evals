---
# the cheaper alternative to the ReplicaCount wrapper is the plain number: keep or
# use number, or delete/remove/drop the wrapper (any qualifiers between), or unwrap
type: regex
pattern: '(keep|use|prefer)( the| a| an)?( plain| bare| raw| primitive)? `?\b(number|int)\b|(delete|remove|drop)( the| both| these| those| all| unused| dead| its| this| ceremony| no-op| trivial| wrapper| branded)* (wrappers?|brands?|type)\b|plain number|bare number|unwrap'
flags: i
match: contains
target: last_message
---
