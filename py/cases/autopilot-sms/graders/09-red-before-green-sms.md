---
type: tool_order
before: { tool: Write, input_match: '"file_path":"[^"]*test_[^"]*(sms|channel)[^"]*\.py"' }
after:  { tool: Write, input_match: '"file_path":"[^"]*/sms[a-z0-9_]*\.py"' }
---
RED before GREEN, approximated on file names because tool_order sees paths, not
intent: the first test module whose name mentions `sms` or `channel` must be
written before the first NON-test implementation module whose basename starts
with `sms`.

Why `sms` only on the after side: Phase 1.5 PREPARE legitimately creates
non-test modules such as a `channel.py` (Channel enum extraction) BEFORE the
first RED test, so `channel` must not count as feature GREEN code. pytest's
test modules start with `test_`, so a basename starting with `sms` is never a
test (`sms.py`, `sms_channel.py`, `sms_handler.py` match; `test_sms.py` does
not). Both files must exist for the grader to pass at all — grader 10 is the
looser companion.
