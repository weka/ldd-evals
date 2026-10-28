---
name: review-full-neutral
tags: [cheap, neutral, review]
runs: 1
max_turns: 80
timeout_seconds: 3600
allowed_tools: [Bash, Read, Edit, Write, Grep, Glob, Agent, Skill]
append_system_prompt: |
  You are running non-interactively: there is no next turn and no user to answer. Never end your turn while a subagent you spawned is still running; when you spawn agents, run them in the foreground (run_in_background: false) and wait for every result before continuing. Do not schedule wakeups or say you will pick something up later; finish the task and print your final report in this turn.
---
Use the pre-commit-review skill to review the whole repository (all files under src/). Write the complete review as your final message: every finding with its file path and line, grouped by file.
