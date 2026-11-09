---
type: tool_used
tool: Bash
input_match: 'mutmut +run|ldd-ledger\.sh["'']? +add +mutation-not-run'
min: 1
---
# R7 runs mutmut over the new leaf module, or the run writes a mutation-not-run row when mutmut is absent.
