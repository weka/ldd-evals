---
# recall: the report names at least one file of this plant by basename or by the spelling recall_match names.
# ids: R10.Q5.production-sleep
type: regex
pattern: 'time\.sleep\(\(?(attempt|_retry_delay)|Replace Sleep with (Cancellable|Timer)|bare \x60?time\.sleep\x60?[^\n]{0,60}(retry|backoff)'
match: contains
target: last_message
---
