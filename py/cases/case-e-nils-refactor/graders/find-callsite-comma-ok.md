---
# the call site handles absence honestly: an exception it catches by name, or a (Device, bool) pair it unpacks; never `is not None` on the result
type: regex
pattern: 'except \w*(NotFound|Unknown|LookupError|KeyError)\w*|\w+, \w+ = \w+\.find\('
match: contains
target: files
---
