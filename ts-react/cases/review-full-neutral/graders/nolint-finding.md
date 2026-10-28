---
# pre-commit-review step 1: every eslint-disable / @ts-expect-error directive in scope is its own finding
type: regex
pattern: 'eslint-disable|ts-expect-error|ts-ignore'
match: contains
target: last_message
---
