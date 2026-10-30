# Baseline generic-gomini-0.1.0-109b0db — the generic plugin over go-mini, cheap tier

Plugin `linter-driven-development` (the generic binding, command prefix `ldd`) from
`buzzdan/ai-coding-rules` at **0.1.0**, main at `109b0db` (the merge of #50, after the
generic binding landed in #49). The Go suite as of this repository's `ee90ce1` (after #23,
the `{{cmd_prefix}}` token, and #24, the baseline name override). Agent model pinned to
`claude-sonnet-5`, judge `claude-haiku-4-5` voting 2 of 3, run 2026-09-18 from a Claude Code
on the web container (Linux), **Claude Code CLI 2.1.276**; every run has `segments: 1`.

This is the floor of the generic plugin, not a new reference for the Go plugin.
`go-2.11.0-c78b55f` stays the reference; the question this baseline answers is how far the
same core, rendered without Go knowledge, falls behind the Go rendering on the Go fixture.
The answer is: nowhere the graders can see, at a cost premium of about a fifth.

    task go:run TIER=cheap CAP=60 OUT=results/generic-floor MODEL=claude-sonnet-5 PLUGIN=../ai-coding-rules/linter-driven-development
    # the cap was reached after review-full run 3 ($64.43 spent); the trigger cases ran in
    # a second invocation that reused every finished run
    task go:run TIER=cheap CAP=70 OUT=results/generic-floor MODEL=claude-sonnet-5 RESUME=1 PLUGIN=../ai-coding-rules/linter-driven-development
    task go:baseline OUT=results/generic-floor NAME=generic-gomini-0.1.0-109b0db PLUGIN=../ai-coding-rules/linter-driven-development

Cheap tier only. The medium tier (the refactor cases, prepare, quickfix-red-lint,
wire-repo-brain) was not run against the generic plugin: its outcomes vary run to run at
one head in the reference (finding 1 there), so one pass would not separate the binding
from the noise, and the owner chose to spend the next budget on the Python fixture instead.

Spend (agent plus judge): **$64.86** over 29 runs, judges $0.32. The reference cheap tier
cost $54.36 for the same 29 runs.

The trace archive `traces.tar.zst` is not in this repo. Copy it from the same path
in the internal `weka/ldd-evals-traces` repo, which only WEKA members can open, then unpack it beside the verdicts before regrading:

    cd baselines/generic-gomini-0.1.0-109b0db && zstd -dc traces.tar.zst | tar -xf - -C .

## Pass rates

Cheap tier (`cheap/`), runs passing every grader:

| Case | Passed | Turns | Cost | Reads as |
|---|---|---|---|---|
| trigger-non-go | 3/3 | 1,1,1 | $0.12 | no skill started under the two-sentence prompt, on any plugin (finding 1) |
| trigger-go | 3/3 | 4,4,6 | $0.31 | skill invoked and announced in every run |
| case-a-retention-review | 1/2 | 25,31 | $3.09 | 11/13 then 13/13: run 1 rendered no `Retention` cluster; the same flip as the reference, other run |
| case-b-endpoint-review | 0/2 | 33,33 | $3.54 | 12/15 both runs; `fix-name-enum` misses both, as in the reference |
| case-c-picker-review | 2/2 | 34,33 | $4.08 | skeptic confirms `Nodes`, flag loop and leaf type named |
| case-d-ceremony-review | 2/2 | 25,32 | $2.51 | negative control: no extraction proposed, in both runs |
| case-e-nils-review | 1/2 | 29,23 | $3.57 | 14/14 then 13/14: run 2 did not name the comma-ok move (`fix-comma-ok`) |
| case-f-globals-review | 1/2 | 45,42 | $7.03 | 14/14 then 13/14: run 2 cited the clean `drain()` control (`precision-drain-clean`) |
| centerpiece-storify-review | 2/2 | 38,48 | $8.99 | `Status` cluster with its rule ids, R3 linter numbers |
| review-clean-tree | 3/3 | 4,7,4 | $0.29 | scope control: "nothing to review", `--all` named, no agent |
| quickfix-clean-tree | 3/3 | 2,3,2 | $0.20 | scope control: "nothing in scope to fix", no agent, no edit |
| review-full | 0/3 | 67,61,57 | $30.81 | **108, 104, 106 of 111**; the report was the final message in all three runs |

Pass rate 0.72 (21 of 29 runs), average grader score 0.97.

## Comparison with go-2.11.0-c78b55f

Same cases, same graders, same fixture, same model pin; only the plugin differs. Runs
passing all graders, then the grader-level view.

| Case | go-2.11.0 | generic 0.1.0 | Grader level | Reads as |
|---|---|---|---|---|
| trigger-go | 3/3 | 3/3 | identical | the generic skill triggers on Go |
| trigger-non-go | 3/3 | 3/3 | identical | not a trigger measurement for this plugin (finding 1) |
| case-a-retention-review | 1/2 | 1/2 | 13/13 · 11/13 → 11/13 · 13/13 | the same two cluster graders flip, in the other run |
| case-b-endpoint-review | 0/2 | 0/2 | 13/15 · 13/15 → 12/15 · 12/15 | one grader down per run: `fix-parameter-object` and `precision-test-clean` (run 1), `skeptic-confirmed` (run 2); `fix-name-enum` still misses both, `skeptic-travels-together` now passes |
| case-c-picker-review | 2/2 | 2/2 | identical | |
| case-d-ceremony-review | 2/2 | 2/2 | identical | |
| case-e-nils-review | 1/2 | 1/2 | 13/14 · 14/14 → 14/14 · 13/14 | `cluster-reporter` passes both runs; `fix-comma-ok` misses once |
| case-f-globals-review | 2/2 | 1/2 | 14/14 · 14/14 → 14/14 · 13/14 | one grader, the `drain()` precision control, in one run |
| centerpiece-storify-review | 2/2 | 2/2 | identical | |
| review-clean-tree | 3/3 | 3/3 | identical | |
| quickfix-clean-tree | 3/3 | 3/3 | identical | |
| review-full | 104 · 103 · 53 | 108 · 104 · 106 | `cluster-role-packages` passes in all three runs (0 of 3 in the reference); `cluster-job-kind` fails in runs 2 and 3 (passed in every reference run); `precision-CTRL.R1.tenant-type` fires in one run instead of every run | run 1 is the highest whole-repository score recorded; the three remaining cluster misses (`Catalog.Find`, `Reporter`, retention) are the reference's finding 3 |

Read against the reference's noise floor: every scoped-review change is one grader, which
that floor calls noise; review-full moved from inside the 100–106 band to its top and past
it. No case regressed by the floor's own rule. The one row that reads as a regression on
pass rate, case F, is one precision grader in one run.

The cost premium is real and consistent: review-full $24.83 → $30.81, the centerpiece
$7.79 → $8.99, case F $6.11 → $7.03, case C $3.28 → $4.08, case A $2.32 → $3.09, case B
$2.89 → $3.54, case E $3.10 → $3.57; only case D got cheaper ($2.87 → $2.51). The
generic plugin's pre-flight detects the language and discovers the test and lint commands
from the repository before any hunter runs, and its rule payloads carry pseudocode where
the Go plugin's carry Go. Turn counts stayed inside the reference's range (review-full
54,63,68 → 67,61,57; the centerpiece 57,43 → 38,48), so the premium is in what each turn
carries, not in extra turns.

## Findings about the generic plugin

1. **The trigger-non-go pass says nothing about the generic plugin's trigger.** The case
   plants a Python repo and asks to "implement a request-id middleware"; the Go suite's
   graders assert the Go workflow is *not* invoked there, and the generic plugin passed
   them: one turn, no `Skill` call, no "Using ldd workflow" line. Read at first as the
   generic skill failing to start on Python, this was the prompt, not the plugin: the
   negative control's system prompt says "do not write any code, state in two sentences
   how you would approach the task", while `trigger-go` says "announce the workflow,
   invoke the skill that runs it". The Python suite's `trigger-py`, which carries the
   invoking prompt, passed 3 of 3 under the generic plugin the same day (announcement,
   skill invoked, pre-flight listed `task test` and `task lint` with ruff and mypy, then
   DONE; $0.57 for six runs, `results/generic-py-smoke`), and its negative control on a
   Go-only repo passed 3 of 3 with the two-sentence prompt. The generic plugin triggers
   on Go and on Python when asked as the trigger cases ask; under the two-sentence prompt
   no plugin starts on any language. A suite that measures the generic plugin needs a
   `trigger-*` case per language with the invoking prompt; the negative controls of the
   language suites are not evidence either way for it.
2. **`cluster-job-kind` fails in two of three whole-repository runs**, where the Go plugin
   rendered it in all three reference runs. The R11 findings on `Job.Kind` are all present
   as singletons; the cluster entry is what is missing. Same shape as the reference's
   finding 3, one more anchor.
3. **`cluster-role-packages` renders in every run** (three of three), where the Go plugin
   never rendered it. The R4 and R5 findings on `internal/common` and `internal/utils`
   converge on a package, not a type, and the reference's finding 3 says the Go cluster
   pass misses exactly that shape. Why the generic rendering catches it is not established;
   the R4 and R5 payloads are the only text that differs, so they are the place to read
   when the Go plugin's cluster pass is next revised.
4. **Vocabulary the graders count is Go-shaped.** `nolint-finding` (review-full run 3)
   wants the literal `nolint` in the report; the generic plugin's text says
   "lint-suppression" and cites the fixture's `//nolint:` directives only when it quotes a
   line. Runs 1 and 2 passed because they quoted one. The Python suite's twin of this grader
   should accept the suppression form of the language under test (`# noqa`,
   `# type: ignore`, `# pylint: disable`) or the plugin's own word for it.
5. **Case B's misses moved but did not shrink.** `fix-name-enum` misses in every run of both
   plugins (the reference's finding 5). The generic plugin additionally missed the parameter
   object move once and the skeptic's `CONFIRMED (score N)` line once; the reference missed
   `evidence-dial` and `skeptic-travels-together` once each. Every miss is one grader in
   one run, inside the noise floor; the case stays at 0/2 for both plugins because of the
   shared `fix-name-enum` miss, not because of the binding.

Unplanted bugs the generic plugin kept finding, as the Go plugin does: the `flushLoop`
goroutine leak and the `lastSeen` map race in `device_service.go`, the missing PagerDuty
case in `validRecipient`, the `NewClient` silent port default.

## Noise floor

This baseline's own two runs per case flip on: case-a 2 (`cluster-retention-r1`, `-r2`),
case-b 3 (`fix-parameter-object`, `precision-test-clean`, then `evidence-dial`,
`skeptic-confirmed`, no grader failing in both), case-e 1 (`fix-comma-ok`), case-f 1
(`precision-drain-clean`), the rest 0; review-full runs differ on `cluster-job-kind`,
`judge-categories`, `precision-CTRL.R1.tenant-type`, `recall-R6.Q1.device-repository` and
`nolint-finding`, one run each. That is the reference's floor with case F added, so the
same reading rule holds for a change to the generic plugin: one grader on a scoped review
is noise, two is a signal; review-full inside 104–108 is noise.

## Grader changes made after the run

- The grader pass after `python-0.2.0-6ef1dcd`: case F's `precision-drain-clean` fails
  on `drain()` in a finding row's location column, not on the word anywhere in the
  report; the `precision: finding` mode on the region-zone-switch control (a
  `file:line` cite in a row naming R11) in place of the bare `Zone()` symbol; the
  review-full timeout at 3600 s. Regrade effect on this baseline, measured against a
  regrade with the graders just before it: case F 1/2 → 2/2 (run 2 cited `drain()`
  inside the scheduler-goroutine finding, the same citation finding 4 of
  `go-2.11.0-c78b55f` describes); no review-full verdict moves. Pass rate 0.72 → 0.76
  (22 of 29).

## Infrastructure notes

- The run executed in one sitting from the web container with the `claude` CLI
  authenticated by the session, not by an API key; the repository's `evals.yml` workflow
  could not run it because the `ANTHROPIC_API_KEY` secret is not set (ldd-evals #24).
- The $60 cap tripped after review-full run 3 with the two trigger cases unrun. The second
  invocation with `RESUME=1` reused all 24 finished runs and ran only the five trigger runs,
  so `cheap/aggregate-result.json` covers every case without a manual rebuild. Budget the
  generic plugin's cheap tier at $70.
- `zstd` is not in the web container's image; `apt-get install zstd` before promoting.
- The plugin directory is read live by every `Skill` call. Nothing was regenerated in the
  measured checkout during this run.
