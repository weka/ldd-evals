---
# PLR2004 on "READY" is enum-shaped: a bare module constant is the wrong fix
# (route R1 "Name enum strings"); the fixture's status.py unpacks its tuple, so
# the tree starts at zero single-line READY constants
type: regex
pattern: '^[A-Z_]+ = "READY"'
flags: m
match: count:0
target: files
---
