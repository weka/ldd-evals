---
# the cheaper alternative to the ReplicaCount wrapper is the plain int: keep or
# use int, or delete/remove/drop the wrapper (any qualifiers between), or unwrap
type: regex
pattern: '(keep|use|prefer)( the| a| an)?( plain| bare| raw)? `?\bint\b|(delete|remove|drop)( the| both| these| those| all| unused| dead| its| this| ceremony| no-op| trivial| wrapper)* wrappers?\b|plain int|bare int|unwrap'
flags: i
match: contains
target: last_message
---
