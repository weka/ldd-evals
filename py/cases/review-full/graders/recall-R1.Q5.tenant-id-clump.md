---
# recall: the report names at least one file of this plant by basename.
# ids: R1.Q5.tenant-id-clump
type: regex
pattern: '(device_service\.py|store\.py|file_repo\.py|mem_store\.py)'
match: contains
target: last_message
---
