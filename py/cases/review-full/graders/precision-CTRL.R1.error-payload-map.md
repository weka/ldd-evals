---
# control CTRL.R1.error-payload-map: healthy code that must draw no finding; its symbol must not
# appear anywhere in the report (a mention IS the false positive).
type: regex
pattern: '(?i)\b(error ?(payload|body|response|message)) (type|class|dataclass)\b|Name the Container[^\n]{0,80}"error"'
match: not_contains
target: last_message
---
