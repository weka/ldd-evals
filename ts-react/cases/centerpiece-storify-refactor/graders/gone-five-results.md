---
# a tuple type with five members, the error travelling as a value: the function's
# return type or the type alias it returns through (HeartbeatOutcome, ParsedLine);
# a five-element array literal (`const X = [...] as const`) is not one
type: regex
pattern: '(type \w+ = |\): )(Promise<)?\[([^,\n]*,){4}[^,\n]*\]'
match: count:0
target: files
---
