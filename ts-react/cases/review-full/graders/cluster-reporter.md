---
# cluster: ≥2 hunters converge on "Reporter"; the report must render a
# 🔗 CLUSTER entry naming it (by the anchor or its last segment).
# members: CASE-E.nil-field-rechecked, CASE-E.exported-nilable-fields, CASE-E.nil-parameters
type: regex
pattern: '(?i:\bcluster\b)[^\n]*\b(?i:Reporter)\b|(?i:\bclusters?\b)[^\n]*(?:\n[^\n]*){0,8}?\n[ \t]*(?:[-*•]|[0-9]+[.)])[ \t]*\**\x60?(?i:Reporter)\b'
match: contains
target: last_message
---
