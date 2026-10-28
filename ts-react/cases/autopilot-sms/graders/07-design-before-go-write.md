---
type: tool_order
before: { tool: Skill, input_match: 'code-designing' }
after:  { tool: Write, input_match: '"file_path":"[^"]*\.tsx?"' }
---
Design before any TypeScript module is created. `Write` covers new files; the
sibling grader 08 covers `Edit` on existing ones.
