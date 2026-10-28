---
# The plant: NewReporter substitutes a default when handed nil. The fix keeps a
# nil check only inside an option, where it records the error (R2's shape), so
# the grader looks for the substitution, not for the check.
type: regex
pattern: '\b(opts|clock) = (&Options\{\}|time\.Now)\b'
match: count:0
target: files
---
