---
# the DOWN-transition notifier retries with a setTimeout backoff that nothing
# cancels, inside the function: the R10 finding beside the R3 one
type: regex
pattern: 'backoff|retry|retries|setTimeout'
flags: i
match: contains
target: last_message
---
