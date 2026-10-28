---
# cluster: ≥2 hunters converge on "Device"; the report must render a
# 🔗 CLUSTER entry naming it (by the anchor or its last segment).
# members: R2.Q1.device-literal-in-service, R2.Q1.device-exported-fields, R2.Q2.validate-device-in-method, R12.Q4.setter
type: regex
pattern: '(?i:\bcluster\b)[^\n]*\b(?i:Device)\b|(?i:\bclusters?\b)[^\n]*(?:\n[^\n]*){0,8}?\n[ \t]*(?:[-*•]|[0-9]+[.)])[ \t]*\**\x60?(?i:Device)\b'
match: contains
target: last_message
---
