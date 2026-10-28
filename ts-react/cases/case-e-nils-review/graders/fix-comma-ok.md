---
# the fix for the parser's malformed-line `return null` is a thrown error, never
# a `[Device, boolean]` tuple; the report names the move or the throw
type: regex
pattern: 'Separate Failure from Absence|throw new \w*Error|\bthrows?\b[^\n]{0,60}\b(malformed|invalid)|(malformed|invalid)[^\n]{0,60}\bthrows?\b'
match: contains
target: last_message
---
