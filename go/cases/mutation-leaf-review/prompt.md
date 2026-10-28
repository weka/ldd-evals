---
name: mutation-leaf-review
tags: [cheap, review, r7-q7]
runs: 3
max_turns: 60
timeout_seconds: 1800
allowed_tools: [Bash, Read, Grep, Glob, Agent, Skill]
append_system_prompt: |
  You are running non-interactively: there is no next turn and no user to answer. Never end your turn while a subagent you spawned is still running; when you spawn agents, run them in the foreground (run_in_background: false) and wait for every result before continuing. Do not schedule wakeups or say you will pick something up later; finish the task and print your final report in this turn.
---
/{{cmd_prefix}}-review internal/pkg/deviceid/deviceid.go internal/pkg/deviceid/deviceid_test.go internal/models/tenant.go internal/models/tenant_test.go internal/utils/strings.go internal/utils/utils_test.go
