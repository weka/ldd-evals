---
# pre-commit-review step 1: every # noqa / # type: ignore / # ty: ignore directive in scope is its own finding
type: regex
pattern: 'noqa|type: ignore|ty: ignore'
match: contains
target: last_message
---
