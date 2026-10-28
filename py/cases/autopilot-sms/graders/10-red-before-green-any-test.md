---
type: tool_order
before: { tool: Write, input_match: '"file_path":"[^"]*/test_[^"/]*\.py"' }
after:  { tool: Write, input_match: '"file_path":"[^"]*/sms[a-z0-9_]*\.py"' }
---
Looser companion to grader 09: SOME new test module precedes the first sms
implementation module, regardless of how the test is named (a `test_phone.py`
or `test_e164.py` RED test still counts). Passes trivially if PREPARE's SAFE
gate wrote characterization tests first — which is the intended order anyway.
