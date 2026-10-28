---
type: tool_order
before: { tool: Write, input_match: '"file_path":"[^"]*([sS]ms|[cC]hannel)[^"]*\.test\.tsx?"' }
after:  { tool: Write, input_match: '"file_path":"[^"]*/[sS]ms[A-Za-z0-9]*\.tsx?"' }
---
RED before GREEN, approximated on file names because tool_order sees paths, not
intent: the first test module whose name mentions `sms` or `channel` must be
written before the first NON-test implementation module whose basename starts
with `sms`.

Why `sms` only on the after side: Phase 1.5 PREPARE legitimately creates
non-test modules such as a `channel.ts` (Channel union extraction) BEFORE the
first RED test, so `channel` must not count as feature GREEN code. Vitest's
test modules end in `.test.ts(x)`, so a basename `sms*.ts(x)` with nothing
between the name and the extension is never a test (`sms.ts`, `smsChannel.ts`,
`SmsSettings.tsx` match; `sms.test.ts` does not). Both files must exist for the
grader to pass at all — grader 10 is the looser companion.
