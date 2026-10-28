---
# The null object for 'no sink' has a name: a class (DiscardSink, NopSink) or a constructor (defaultSink(), systemClock()); any of those is the fix.
type: regex
pattern: '(function|const) (default|system|discard|nop|noop|null)\w*\s*[=(]|^export (class|const) (Discard|Nop|Noop|Null)\w*'
flags: m
match: contains
target: files
---
