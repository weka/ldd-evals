---
type: regex
pattern: '(own|separate|new|dedicated) module|src/services/transport/\w+/|sub-?package|nested package|\bexpand\w*\.ts'
flags: i
match: contains
target: last_message
---
# The fix moves the leaf into its own module, beside the I/O one or below it. A bare mention of
# the I/O file name does not match.
