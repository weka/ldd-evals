---
type: regex
pattern: 'sub-?package|nested package|(own|separate|new|dedicated) package|expand\w*/|split the pure leaf out of an I/O package'
flags: i
match: contains
target: last_message
---
# The fix moves the leaf into a sub-package folder below the feature package. A plain .py
# module or a bare mention of the I/O file name does not match.
