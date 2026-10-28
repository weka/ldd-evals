# The neutral cases: old plugin against new, same prompt

The eight `*-neutral` cases beside the review cases exist for one comparison:
the hand-written 1.x TypeScript + React plugin against the generated one, on the
same fixture, graded on the same assertions. The 1.x plugin has no slash
commands and no report contract — no `📊 CODE REVIEW REPORT`, no `🔗 CLUSTER`
entries, no rule ids, no skeptic verdicts — so the ordinary review cases cannot
be pointed at it: their prompts invoke `/tsr-ldd-review` and most of their
graders read the report contract.

Each neutral case is the twin of one review case:

| Neutral case | Twin | Scope the prompt names |
|---|---|---|
| `review-full-neutral` | `review-full` | the whole repository (all files under `src/`) |
| `case-a-retention-review-neutral` | `case-a-retention-review` | the two retention modules |
| `case-b-endpoint-review-neutral` | `case-b-endpoint-review` | the transport client |
| `case-c-picker-review-neutral` | `case-c-picker-review` | the placement picker |
| `case-d-ceremony-review-neutral` | `case-d-ceremony-review` | grants and the trace helper (the control) |
| `case-e-nils-review-neutral` | `case-e-nils-review` | the three report modules |
| `case-f-globals-review-neutral` | `case-f-globals-review` | config, export, the scheduler hook, main |
| `centerpiece-storify-review-neutral` | `centerpiece-storify-review` | the heartbeat feed |

What differs from the twin, and nothing else:

- **The prompt** asks for the skill by its name, which both plugins carry
  (`pre-commit-review`), with no `{{cmd_prefix}}` token:
  *"Use the pre-commit-review skill to review `<scope>`. Write the complete
  review as your final message: every finding with its file path and line,
  grouped by file."* The same scaffold, `max_turns`, `timeout_seconds` and
  `allowed_tools` as the twin; `runs: 1`.
- **The tags** are `[cheap, neutral, <family>]`, so a neutral case runs in the
  cheap tier of an ordinary run (the new plugin's side of the comparison comes
  for free) and the `neutral` tag selects the eight alone.
- **The graders** are the twin's plugin-neutral subset, copied by
  `sync-neutral-graders.sh` (run by `task ts-react:graders`, never hand-edited):
  regex graders whose name and pattern carry no rule id, question id, cluster,
  skeptic verdict, Stop check, report banner, category emoji or Fix-pattern move
  name. That leaves the file-anchor graders (`config\.ts:[0-9]+`, the generated
  `recall-*` of the whole-repository review, the `precision-*` that read a file
  or a symbol) and the symbol graders (`baseUrl`, `primaryFound`,
  `ReplicaCount`, the section markers). `tool_used` and `llm` graders are not
  copied: the prompt forbids nothing and the judges read the report contract.
  The dropped graders are the measurement of what the contract adds; the kept
  ones are the measurement of what the review sees.

## Running the A/B

The runner selects cases by one tag (`--tag`), which the suite's Taskfile
forwards as `TIER`:

    # the generated plugin (default PLUGIN)
    task ts-react:run TIER=neutral CAP=40 OUT=results/ab-new

    # the hand-written 1.x plugin: it has no commands/ directory, so the command
    # prefix cannot be read from it; any valid prefix will do because no
    # neutral prompt or grader carries the token
    task ts-react:run TIER=neutral CAP=40 OUT=results/ab-old \
      PLUGIN=/path/to/the/1.x/plugin CMD_PREFIX=ldd

Both plugins answer to the same plugin name in their `.claude-plugin/plugin.json`
(`ts-react-linter-driven-development`), so the `Skill(...)` ids the agent uses
are identical. Compare the two runs grader by grader
(`<out>/neutral/<case>/run-1/result.json`): a grader that passes under the new
plugin and fails under the old is a plant the generated rules see and the
hand-written skill did not; the reverse is a regression to read before shipping.
`task ts-react:regrade OUT=results/ab-old TIER=neutral PLUGIN=... CMD_PREFIX=ldd`
re-applies the current graders to either run without paying for agents again.

The neutral cases say nothing about the workflow commands, the refactors or the
report's shape; those are the ordinary cases' job, and only the new plugin can
take them.
