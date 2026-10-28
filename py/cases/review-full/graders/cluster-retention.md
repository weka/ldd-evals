---
# cluster: ≥2 hunters converge on "retention"; the report must render a
# 🔗 CLUSTER entry naming it (by the anchor or its last segment).
# members: CASE-A.retention-range-twice, CASE-A.defensive-recheck, CASE-A.zero-sentinel
type: regex
pattern: '(?i:\bcluster\b)[^\n]*\b(?i:retention)\b|(?i:\bclusters?\b)[^\n]*(?:\n[^\n]*){0,8}?\n[ \t]*(?:[-*•]|[0-9]+[.)])[ \t]*\**\x60?(?i:retention)\b'
match: contains
target: last_message
---
