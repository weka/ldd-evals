---
# The null object for 'no sink' has a name: a class (DiscardSink, NopSink) or a constructor (default_sink(), system_clock()); any of those is the fix.
type: regex
pattern: 'def (default|system|discard|nop|noop|null)\w*\(|^class (Discard|Nop|Noop|Null)\w*'
flags: m
match: contains
target: files
---
