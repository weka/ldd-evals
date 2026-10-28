---
# the parser's malformed-line `return null` became a thrown error: a `name/model`
# line with no separator, name or model is a failure, not the blank-line absence
# (the manifest's CASE-E.nil-return oracle). `find` returning `CatalogDevice |
# undefined` is a declared absence tsc checks at every call site and stays.
type: regex
pattern: 'throw new \w*Error\([^\n]*(catalog|name/model|(malformed|bad|invalid|unparsable|broken) (catalog |device )?line\b)'
match: contains
target: files
---
