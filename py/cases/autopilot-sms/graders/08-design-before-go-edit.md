---
type: tool_order
before: { tool: Skill, input_match: 'code-designing' }
after:  { tool: Edit, input_match: '"file_path":"[^"]*\.py"' }
---
Design before any existing Python module is modified. Prep (Phase 1.5) edits and the
route wiring both go through Edit, so this catches a pre-design "quick change"
that grader 07 (Write only) would miss. Both tools occur in every autopilot run,
which tool_order requires.
