---
# the report anchors a finding in one of the three report modules
type: regex
pattern: '(reporter|catalog|wire)\.ts:[0-9]+'
match: contains
target: last_message
---
