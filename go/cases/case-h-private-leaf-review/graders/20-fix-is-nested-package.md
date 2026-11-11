---
type: regex
pattern: 'internal/transport/\w+/|sub-?package|nested package|Split the pure leaf out of an I/O package'
flags: i
match: contains
target: last_message
---
# The fix moves the leaf into a nested package. The path pattern needs a directory slash after the
# nested name, so the file name of the I/O file alone does not match.
