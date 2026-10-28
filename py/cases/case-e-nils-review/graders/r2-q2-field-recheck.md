---
type: regex
pattern: '(reporter|catalog|wire)\.py:[0-9]+.{0,500}\bQ2\b'
flags: s
match: contains
target: last_message
---
