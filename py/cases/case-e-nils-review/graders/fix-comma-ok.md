---
# the fix for the parser's malformed-line `return None` is an exception, never
# a `tuple[Device, bool]`; the report names the move or the raise
type: regex
pattern: 'Separate Failure from Absence|raise \w*Error|\braises?\b[^\n]{0,60}\b(malformed|invalid)|(malformed|invalid)[^\n]{0,60}\braises?\b'
match: contains
target: last_message
---
