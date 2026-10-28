---
# control CTRL.R1.tenant-type: healthy code that must draw no finding; its symbol must not
# appear anywhere in the report (a mention IS the false positive).
type: regex
pattern: '(?i)type Tenant\b|\b(introduce|create|add|define|extract|new)\b[^\n.]{0,40}\bTenant (type|struct|domain type)|Replace Primitive with Domain Type[^\n]{0,80}\bTenant\b|\bTenant\b[^\n]{0,60}Replace Primitive with Domain Type'
match: not_contains
target: last_message
---
