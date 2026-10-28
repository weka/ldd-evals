---
# lint-fixer report: the mechanical class is FIXED (the floating promise given its
# await and the unused import removed are the surest members); accepts the
# contract's FIXED: line or a FIXED section listing rules
type: regex
pattern: 'FIXED\b.{0,600}(no-floating-promises|unused-imports|no-unused-vars|no-else-return|elseif-without-else|prefer-read-only-props|no-duplicate-string|no-magic-numbers|simple-import-sort|prefer-const)'
flags: s
match: contains
target: trace
---
