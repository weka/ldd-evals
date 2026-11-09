---
type: tool_used
tool: Bash
input_match: 'gremlins unleash \./internal/transport/\w+'
min: 1
---
# R7 runs the mutation tool over the new leaf package, never over the module.
# The runner gives the agent the user's PATH, so gremlins is there when the host has it.
