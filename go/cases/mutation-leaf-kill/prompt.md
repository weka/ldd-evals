---
name: mutation-leaf-kill
tags: [medium, testing, r7-q7]
runs: 2
max_turns: 80
timeout_seconds: 3600
allowed_tools: [Bash, Read, Edit, Write, Grep, Glob, Agent, Skill]
append_system_prompt: |
  You are running non-interactively: there is no next turn and no user to answer. Never end your turn while a subagent you spawned is still running; when you spawn agents, run them in the foreground (run_in_background: false) and wait for every result before continuing. Do not schedule wakeups or say you will pick something up later; finish the task and print your final report in this turn.
---
The tests in internal/pkg/deviceid, internal/models and internal/utils must prove their logic, not just cover it: no mutant may survive them. Bring those three packages to that bar without changing what the code does. Commit the result.
