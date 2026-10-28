---
# the Status cluster names R1 among its rules; the ids may sit on the line
# after the header, so the search spans lines within 500 characters
type: regex
pattern: '(?is)\bcluster\b[^\n]*status.{0,500}\bR1\b'
match: contains
target: last_message
---
