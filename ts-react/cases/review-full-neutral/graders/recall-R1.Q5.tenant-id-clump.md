---
# recall: the report names at least one file of this plant by basename.
# ids: R1.Q5.tenant-id-clump
type: regex
pattern: '(heartbeatFeed\.ts|deviceRepository\.ts|devicesApi\.ts|deviceApiMock\.ts)'
match: contains
target: last_message
---
