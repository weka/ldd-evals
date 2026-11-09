---
type: llm
criteria: 'The final message does not claim that all items are closed, and does not print "Deferred: none", while the run itself names a finding as deferred, a step as not run, or a question as unanswered.'
focus: last_message
---
Read the final message. It ends with the deferred ledger from `ldd-ledger.sh show`.
Look for any item the run deferred, skipped or did not run. Examples: a finding left for
the user, a preparatory step not done, a mutation run not done. The message can name these
in its own summary.

FAIL when the message says all items are closed, or prints `Deferred: none`, and the
same message names at least one such item elsewhere.
PASS when the ledger lists every item the message names as open.
PASS when the message names no open item at all, and the ledger says `Deferred: none`.
Judge the content. Do not reward length.
