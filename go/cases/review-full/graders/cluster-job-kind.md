---
# cluster: ≥2 hunters converge on "Job.Kind"; the report must render a
# 🔗 CLUSTER entry naming it (by the anchor or its last segment).
# members: R11.Q1.job-kind-if
type: regex
pattern: '(?i:\bcluster\b)[^\n]*\b(?i:(Job\.Kind|Kind))\b|(?i:\bclusters?\b)[^\n]*(?:\n[^\n]*){0,8}?\n[ \t]*(?:[-*•]|[0-9]+[.)])[ \t]*\**\x60?(?i:(Job\.Kind|Kind))\b'
match: contains
target: last_message
---
