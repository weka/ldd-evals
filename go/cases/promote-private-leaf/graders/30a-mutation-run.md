---
type: tool_used
tool: Bash
input_match: 'gremlins unleash \./internal/transport/\w+|ldd-ledger\.sh["'']? +add +mutation-not-run'
min: 1
---
# R7 runs the mutation tool over the new leaf package, never over the module.
# A host without gremlins writes a mutation-not-run row instead, and that run is correct.
# The runner gives the agent the user's PATH, so gremlins is there when the host has it.
