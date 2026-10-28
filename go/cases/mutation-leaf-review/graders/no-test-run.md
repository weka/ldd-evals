---
type: tool_used
tool: Bash
input_match: 'gremlins|go test\b'
min: 0
max: 0
---
# Review is read-only and the rule hunter never runs tests; gremlins runs the
# suite once per mutant. This case measures the hand check, not the tool.
