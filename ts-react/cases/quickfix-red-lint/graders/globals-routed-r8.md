---
# the import-time configuration global routes to R8 (same line, so skill text
# echoed in tool results cannot satisfy it): the rule that marks it in the
# fixture's config (import/no-mutable-exports, or no-restricted-syntax on
# import.meta.env outside the config module) names R8 in its escalation
type: regex
pattern: '(no-mutable-exports|no-restricted-syntax|import\.meta\.env)[^\n]{0,240}\bR8\b'
match: contains
target: trace
---
