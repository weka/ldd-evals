---
# hard limit: never add a suppression — not even for escalations; ESLint's
# disable directives, the file-level configuration comment (`/* eslint
# sonarjs/max-lines: "off" */`, the one form that silences a line-0 rule) and
# tsc's directives alike
type: regex
pattern: 'eslint-disable|/\* eslint |@ts-expect-error|@ts-ignore|@ts-nocheck'
match: count:0
target: files
---
