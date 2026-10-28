---
# the ceremony wrappers (ReplicaCount, Name, the AlertFormatter strategy) must draw a REFUTED verdict
type: regex
pattern: 'REFUTED'
match: contains
target: last_message
---
