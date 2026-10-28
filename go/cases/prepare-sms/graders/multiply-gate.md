---
# the gate that fires for a fourth case in a triplicated switch: named MULTIPLY,
# or described as the plan adding a case/arm to the duplicated switches
type: regex
pattern: '(?i)\bMULTIPL|\b(new|fourth|4th|another|extra|additional) (case|arm|branch)\b[^\n]{0,100}\bswitch|\bswitch(es)?\b[^\n]{0,100}\b(new|fourth|4th|another|extra|additional) (case|arm|branch)\b'
match: contains
target: last_message
---
