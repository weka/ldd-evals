---
type: regex
pattern: 'export const \w+ = expandEnv|__testing *='
flags: i
match: not_contains
target: last_message
---
# The report never proposes a door that exports the private name for tests only.
# The pattern matches the code of a proposal (an alias, a hook assignment). A plain `export { expandEnv }` is not matched: the same line is right in the new module.
# A report that names the door only to reject it ("do not add export_test.go") does not match.
# A proposal made in prose alone is not caught; the case-level check for the door is the tool-use grader of the refactor case.
