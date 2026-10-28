---
# no-magic-numbers / no-duplicate-string on 'READY' is enum-shaped: a bare module
# constant is the wrong fix (route R1 "Name enum strings"); the fixture starts at
# zero single-line READY constants
type: regex
pattern: "^(export )?const [A-Z_]+ = 'READY'"
flags: m
match: count:0
target: files
---
