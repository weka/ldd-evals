---
type: file_exists
path: 'internal/transport/*/*.go'
---
# The private leaf moved into a nested package below the I/O one. The postcheck checks
# the rest: its own tests, full coverage, the old name gone from the I/O file.
