---
# the region code sliced off the tag and compared to the literal, in both copies of
# the parse (the inline `code === 'eu'` in processHeartbeat and the `t.slice(7) ===
# 'eu'` in normalizeTags); the `return code === 'eu' || …` in types/tags.ts is the
# one owner that may stay
type: regex
pattern: "\\(code === 'eu'|\\.(slice|substring)\\(7\\) === 'eu'"
match: count:0
target: files
---
