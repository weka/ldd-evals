---
# cluster: ≥2 hunters converge on "Alert.Channel"; the report must render a
# 🔗 CLUSTER entry naming it (by the anchor or its last segment).
# members: R1.Q3.raw-channel-string, R2.Q1.alert-exported-fields, R11.Q1.channel-switch, R11.Q3.default-unknown-channel
type: regex
pattern: '(?i:\bcluster\b)[^\n]*\b(?i:(Alert\.Channel|Channel))\b|(?i:\bclusters?\b)[^\n]*(?:\n[^\n]*){0,8}?\n[ \t]*(?:[-*•]|[0-9]+[.)])[ \t]*\**\x60?(?i:(Alert\.Channel|Channel))\b'
match: contains
target: last_message
---
