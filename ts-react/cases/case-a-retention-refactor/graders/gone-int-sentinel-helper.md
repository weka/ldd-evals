---
# the helper that parsed the setting into a bare number and used 0 for "not set"
type: regex
pattern: 'function retentionDays\(raw: Record<string, string>\): number'
match: count:0
target: files
---
