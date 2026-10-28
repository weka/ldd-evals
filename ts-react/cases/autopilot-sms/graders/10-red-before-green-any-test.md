---
type: tool_order
before: { tool: Write, input_match: '"file_path":"[^"/]*\.test\.tsx?"|"file_path":"[^"]*/[^"/]*\.test\.tsx?"' }
after:  { tool: Write, input_match: '"file_path":"[^"]*/[sS]ms[A-Za-z0-9]*\.tsx?"' }
---
Looser companion to grader 09: SOME new test module precedes the first sms
implementation module, regardless of how the test is named (a `phone.test.ts`
or `e164.test.ts` RED test still counts). Passes trivially if PREPARE's SAFE
gate wrote characterization tests first — which is the intended order anyway.
