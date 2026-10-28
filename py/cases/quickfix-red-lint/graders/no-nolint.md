---
# hard limit: never add a suppression — not even for escalations; ruff's noqa,
# mypy's type: ignore and ty's ty: ignore alike
type: regex
pattern: '# noqa|# type: ignore|# ty: ignore'
match: count:0
target: files
---
