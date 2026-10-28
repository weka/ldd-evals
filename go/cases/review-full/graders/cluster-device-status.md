---
# cluster: ≥2 hunters converge on "Device.Status"; the report must render a
# 🔗 CLUSTER entry naming it (by the anchor or its last segment).
# members: R1.Q3.status-string-compare, R1.Q3.status-enum-goconst, R11.Q1.status-switch
type: regex
pattern: '(?i:\bcluster\b)[^\n]*\b(?i:(Device\.Status|Status))\b|(?i:\bclusters?\b)[^\n]*(?:\n[^\n]*){0,8}?\n[ \t]*(?:[-*•]|[0-9]+[.)])[ \t]*\**\x60?(?i:(Device\.Status|Status))\b'
match: contains
target: last_message
---
