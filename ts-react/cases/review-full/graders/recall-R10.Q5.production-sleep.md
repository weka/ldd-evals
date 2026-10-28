---
# recall: the report names at least one file of this plant by basename or by the spelling recall_match names.
# ids: R10.Q5.production-sleep
type: regex
pattern: 'setTimeout\(resolve, \(?(attempt|retryDelay|\(attempt)|Replace Sleep with Cancellable Wait|awaited \x60?setTimeout\x60?[^\n]{0,60}(retry|backoff)'
match: contains
target: last_message
---
