---
name: trigger-py
tags: [cheap, trigger]
runs: 3
max_turns: 6
timeout_seconds: 600
allowed_tools: [Bash, Read, Edit, Write, Grep, Glob, Agent, Skill]
append_system_prompt: |
  This is a dry run of the workflow, not of the code. Start the request exactly as
  you would for real: announce the workflow, invoke the skill that runs it, and let
  it discover the pre-flight commands (test and lint). Stop before the first edit:
  once the pre-flight commands are listed, write no code and print DONE on its own
  line.
  You are running non-interactively: there is no next turn and no user to answer. Never end your turn while a subagent you spawned is still running; when you spawn agents, run them in the foreground (run_in_background: false) and wait for every result before continuing. Do not schedule wakeups or say you will pick something up later; finish the task and print your final report in this turn.
---
implement a request-id middleware for the HTTP server
