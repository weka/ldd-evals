# Baseline go-2.13.2 — cheap and medium tiers, the close of the token-budget stages S1 to S9

Plugin `buzzdan/ai-coding-rules` at **b56f79b** (the squash merge of #75, token-budget stage
S8b), version field 2.13.2. The Go suite as of this repository's `7576e9e` (after #37 and
#38). Agent model pinned to `claude-sonnet-5`, judge `claude-haiku-4-5` voting 2 of 3, run
2026-09-29 to 2026-09-30 on a macOS 25.5 laptop, **Claude Code CLI 2.1.259**, every run
`segments: 1`.

This baseline replaces go-2.11.0-c78b55f as the reference. It is the "after" of the
token-budget stages (plugin PRs #60 to #75: bounded hunters, one hunter per rule family,
the skeptic on extractions only, the critic in chunks, the review's detection pass and
scope bundle as scripts) and the "before" of stage S6, the analyzer. Stages S7, S8 and S9
were each proved against the previous stage's run in a cloud session whose traces were
never promoted; this is the first run since 2.11.0 whose traces are on disk, and the first
whose README carries the spend section `docs/token-budget.md` in the plugin repository
asks for.

    task go:run TIER=cheap  CAP=90 MODEL=claude-sonnet-5 OUT=results/go-baseline-b56f79b PLUGIN=<checkout>/go-linter-driven-development
    task go:run TIER=medium CAP=45 MODEL=claude-sonnet-5 OUT=results/go-baseline-b56f79b PLUGIN=<checkout>/go-linter-driven-development
    scripts/promote-baseline.sh results/go-baseline-b56f79b <checkout>/go-linter-driven-development

Spend (agent plus judge): cheap **$51.28** over 32 runs, medium **$41.54** over 12 runs.
Billed tokens: cheap 42.5M, medium 101.2M (the spend section below).

The trace archive `traces.tar.zst` is not in this repo. Copy it from the same path
in the internal `weka/ldd-evals-traces` repo, which only WEKA members can open, then unpack it beside the verdicts before regrading:

    cd baselines/go-2.13.2-b56f79b && zstd -dc traces.tar.zst | tar -xf - -C .

Graders that read the scaffold tree (files, postcheck, art judges) report "needs the kept
scaffold" from a clone; the transcript graders reproduce.

## Pass rates

Cheap tier (`cheap/`), graders passed per run:

| Case | Graders | Turns | Cost | Reads as |
|---|---|---|---|---|
| trigger-non-go | 2/2 · 2/2 · 2/2 | 1,1,1 | $0.17 | negative trigger control holds |
| trigger-go | 3/3 · 3/3 · 3/3 | 4,4,4 | $0.42 | skill invoked and announced in every run |
| case-a-retention-review | 11/13 · 11/13 | 15,15 | $2.03 | `Retention` found and confirmed both runs; the cluster entry for it is not rendered (the same two graders as 2.11.0 run 2) |
| case-b-endpoint-review | 14/15 · 13/15 | 13,11 | $2.69 | `Port` confirmed, `Endpoint` refuted with its cheaper alternative both runs; the misses are two wording regexes (`dial(`, "travels together") |
| case-c-picker-review | 8/10 · 8/10 | 14,13 | $2.42 | **the flag-driven loop is missed both runs** (finding 1); `Nodes` never proposed |
| case-d-ceremony-review | 12/12 · 11/12 | 14,13 | $2.89 | negative control: no extraction proposed; run 2 names `trace` while clearing it |
| case-e-nils-review | 13/14 · 14/14 | 14,14 | $2.98 | `Reporter` constructor and Null Object named; run 1 cites `NewCatalog` while clearing it |
| case-f-globals-review | 14/14 · 14/14 | 18,13 | $5.01 | Extract Clean Island / Push the Global Up named; the test that mutates the global found (R8 Q6, the lead #75 fixed) |
| centerpiece-storify-review | 12/12 · 12/12 | 14,17 | $6.44 | `Status` cluster with its rule ids |
| mutation-leaf-review | 7/12 · 7/12 · 7/12 | 25,18,12 | $5.69 | **no R7 in any report** (finding 2); new case (#37), no 2.11.0 reference |
| review-clean-tree | 4/4 · 4/4 · 4/4 | 3,2,2 | $0.31 | scope control: "nothing to review", `--all` named, no agent |
| quickfix-clean-tree | 6/6 · 6/6 · 6/6 | 4,2,2 | $0.32 | scope control: "nothing in scope to fix", no agent, no edit |
| review-full | **109 · 104 · 109 of 114** | 17,17,19 | $18.66 | the report in the message every run; header reconciles every hunter; the same four cluster graders miss (finding 3) |

**A regrade with the current graders** counts one more grader in review-full:
`recall-R5.Q7.models-file-count`. It needs the package-size row that the detection pass
writes for R5 question 7. This plugin does not write it, so the grader fails by design:
read it as new capability, not as a regression.

Medium tier (`medium/`), graders passed:

| Case | Graders | Turns | Cost | Reads as |
|---|---|---|---|---|
| case-a-retention-refactor | 4/6 | 52 | $2.50 | `parseRetentionDays` left as a bare helper beside the type (art judge); postcheck |
| case-b-endpoint-refactor | 5/5 | 28 | $1.09 | |
| case-c-picker-refactor | 4/9 | 49 | $2.02 | no `Nodes` collection type; `stop-check` not rendered (2.11.0 finding 1 persists) |
| case-d-ceremony-refactor | 3/5 | 56 | $2.82 | art judge on the `trace` comment; `stop-check` not rendered |
| case-e-nils-refactor | 9/10 | 55 | $2.65 | `stop-check` not rendered |
| case-f-globals-refactor | 6/7 | 123 | $4.93 | `Config` global gone; postcheck ratchet |
| centerpiece-storify-refactor | 9/12 | 85 | $7.43 | three named chapters; gocyclo 9 against the limit of 8; `force` saves left |
| mutation-leaf-kill | 3/4 · 3/4 | 64,63 | $2.55 | postcheck unreadable here: `gremlins` is not installed on this machine, so its "no surviving mutant" rows read `999` (infrastructure note) |
| prepare-sms | 5/5 | 105 | $5.16 | all four gates, one prep commit |
| quickfix-red-lint | 6/9 | 121 | $7.79 | **hit `max_turns`** after 67 edits; `FIXED … errcheck` never rendered; 76 `//nolint` left (finding 4) |
| wire-repo-brain | 10/10 | 34 | $1.08 | |

Pass rates: cheap 0.56 (18 of 32 runs), medium 0.25 (3 of 12); average grader score 0.92
and 0.78.

## Comparison with go-2.11.0-c78b55f

Same graders where nothing changed; `mutation-leaf-review` and `mutation-leaf-kill` are new
(#37) and review-full gained three graders (114 against 111, the R7 Q7 recall rows).

| Case | 2.11.0 | 2.13.2 | Cost | Turns | Reads as |
|---|---|---|---|---|---|
| trigger-go | 3/3 ×3 | 3/3 ×3 | $0.28 → $0.42 | 4 → 4 | identical |
| trigger-non-go | 2/2 ×3 | 2/2 ×3 | $0.12 → $0.17 | 1 → 1 | identical |
| case-a-retention-review | 13/13 · 11/13 | 11/13 · 11/13 | $2.32 → $2.03 | 24,25 → 15,15 | the cluster render, the flip 2.11.0 already had |
| case-b-endpoint-review | 13/15 · 13/15 | 14/15 · 13/15 | $2.89 → $2.69 | 24,43 → 13,11 | `fix-name-enum` now passes; two wording regexes miss instead |
| case-c-picker-review | 10/10 · 10/10 | 8/10 · 8/10 | $3.28 → $2.42 | 36,31 → 14,13 | **regression**, finding 1 |
| case-d-ceremony-review | 12/12 · 12/12 | 12/12 · 11/12 | $2.87 → $2.89 | 29,30 → 14,13 | one precision control cited while cleared |
| case-e-nils-review | 13/14 · 14/14 | 13/14 · 14/14 | $3.10 → $2.98 | 22,31 → 14,14 | same count, a different single grader |
| case-f-globals-review | 14/14 · 14/14 | 14/14 · 14/14 | $6.11 → $5.01 | 41,45 → 18,13 | identical verdicts, a third fewer turns |
| centerpiece-storify-review | 12/12 · 12/12 | 12/12 · 12/12 | $7.79 → $6.44 | 57,43 → 14,17 | identical verdicts, a third of the turns |
| review-clean-tree | 4/4 ×3 | 4/4 ×3 | $0.27 → $0.31 | 6,3,4 → 3,2,2 | identical |
| quickfix-clean-tree | 6/6 ×3 | 6/6 ×3 | $0.22 → $0.32 | 3,3,3 → 4,2,2 | identical |
| review-full | 104 · 103 · 53 of 111 | 109 · 104 · 109 of 114 | $24.83 → $18.66 | 54,63,68 → 17,17,19 | the report in the message every run; recall up five graders at the ceiling; a quarter fewer dollars at a third of the turns |
| case-a-retention-refactor | 5/5 | 4/6 | $1.76 → $2.50 | 54 → 52 | new art judge and postcheck rows (#8 and later) |
| case-b-endpoint-refactor | 4/4 | 5/5 | $3.07 → $1.09 | 85 → 28 | |
| case-c-picker-refactor | 5/8 | 4/9 | $1.08 → $2.02 | 42 → 49 | inside the observed swing (2.11.0: 8/8 ↔ 5/8) |
| case-d-ceremony-refactor | 3/4 | 3/5 | $0.44 → $2.82 | 18 → 56 | art judge as before; three times the turns |
| case-e-nils-refactor | 8/9 | 9/10 | $1.73 → $2.65 | 51 → 55 | |
| case-f-globals-refactor | 3/6 | 6/7 | $1.50 → $4.93 | 73 → 123 | `var region` and `init()` gone this run; the ratchet postcheck misses; 16.3M tokens |
| centerpiece-storify-refactor | 5/11 | 9/12 | $2.22 → $7.43 | 51 → 85 | four more graders, three times the dollars |
| prepare-sms | 5/5 | 5/5 | $3.21 → $5.16 | 96 → 105 | |
| quickfix-red-lint | 8/8 | 6/9 | $7.75 → $7.79 | 26 → 121 | **regression**, finding 4 |
| wire-repo-brain | 10/10 | 10/10 | $1.38 → $1.08 | 43 → 34 | identical |

The review path is the story the token-budget stages told: every scoped review at a third
to a half of its turns, the whole-repository review five graders up at a quarter fewer
dollars, verdicts otherwise unchanged — except Case C, where the scripts' lead for the flag
loop is narrower than the parent's improvised grep was. The refactor path was not a target
of those stages and moved the other way on spend: three refactor cases at two to three
times the turns, and the quickfix case running out of turns.

## Findings about the plugin, in order

1. **The flag-driven loop in Case C is not a lead.** The Go R3 Q4 detect line reads
   `:= (false|true)$` and the plant is the tuple form `primaryFound, secondaryFound :=
   false, false`. R3 has no other hit in `picker.go`, so under S8b the structure hunter is
   not spawned and nothing reads the loop; `evidence-flags` and `fix-extract-leaf-type`
   miss in both runs where 2.11.0 passed both. The Python line `^\s+[a-z_]+ =
   (False|True)$` has the same tuple gap. The fix is the pattern, and it re-runs Case C.
2. **The mutation review never reaches R7 Q7.** Over its six files the tests-and-dependencies
   family (R6, R7, R8, R10) has no mechanical hit, so no hunter is spawned for it, and the
   hand check R7 Q7 spells out for a read-only review — list the leaf's boundaries, name the
   missing table row — never runs; the three reports carry no `R7` at all, and the five
   R7 graders miss in every run. Q7 is `judgment` in both bindings. The class is the one
   #75's branch review named: a judgment question is only read where its family has a hit.
   The fix is a lead for Q7 — a boundary comparison in a leaf's production code, or a
   table in its test — and it re-runs `mutation-leaf-review`.
3. **The whole-repository review holds its band and its cluster misses.** 109, 104 and 109
   of 114 against the S7 to S9 arms' 102 to 110 of 111. `cluster-retention` and
   `cluster-role-packages` miss in all three runs, `cluster-catalog-find` and
   `cluster-reporter` in two, `cluster-job-kind` in two — the same anchors 2.11.0's
   finding 3 named, package-shaped or spread over one file's lines. The recall misses are
   one or two per run and differ by run (`R7.Q7.tenant-rune-boundary` twice,
   `R1.Q3.raw-channel-string` and `R4.Q3.role-named-packages` once). Every precision control
   passed in every run, including the `Tenant` one 2.11.0 flagged.
4. **The refactor tier spends more and one case runs out of turns.** `quickfix-red-lint`
   made 67 edits in 121 turns and hit `max_turns` without rendering a `FIXED … errcheck`
   line, leaving 76 `//nolint` in the tree (2.11.0: 8/8 in 26 turns). `case-f-globals-refactor`
   took 123 turns and 16.3M tokens, `centerpiece-storify-refactor` 85 and 14.4M,
   `case-d-ceremony-refactor` 56 where 2.11.0 took 18. None of the token-budget stages
   measured the refactor tier after S3, and the three-grader swing 2.11.0 recorded on C, F
   and the centerpiece means one run cannot separate a regression from the noise: the next
   refactor-path change should start with a second medium pass at this head. The `stop-check`
   block still never renders (2.11.0 finding 1).

## Noise floor

This baseline's own cheap pairs flip on: case-b 1 (`evidence-dial`), case-d 1
(`precision-trace-func-clean`), case-e 1 (`precision-newcatalog-clean`), the rest 0 — Case A
holds its two misses in both runs, Case C its two. review-full's three runs differ on five
graders (`cluster-catalog-find`, `cluster-job-kind`, `cluster-reporter`,
`recall-R1.Q3.raw-channel-string`, `recall-R4.Q3.role-named-packages`,
`recall-R7.Q7.tenant-rune-boundary`), between 104 and 109. The scoped review cases B and F
ran twice more each on the S8b branch before this baseline (plugin PR #75): B 14 · 14 ·
14 · 15, F 14 in every run, the same graders flipping.

Reading rules for the next comparison: a scoped-review change of one grader is noise, two
on the same grader in both runs is a signal (Case C here); review-full inside 104–109 of
114 is noise; a refactor case needs a second run before a change of up to three graders on
C, D, F or the centerpiece is read; A, B, prepare-sms and wire-repo-brain have not flipped.

## Spend

The instrument is `scripts/spend-report.py` in the plugin repository, over the unpacked
traces. Billed tokens per run, cheap tier — the review tier `docs/token-budget.md` measured
at 65.6M over 29 runs on 2.11.0:

| Case | Billed tokens per run | Agents |
|---|---|---|
| case-a-retention-review | 1.08M · 1.26M | 3 · 3 |
| case-b-endpoint-review | 1.07M · 1.14M | 4 · 4 |
| case-c-picker-review | 1.27M · 1.05M | 4 · 4 |
| case-d-ceremony-review | 1.43M · 1.29M | 4 · 4 |
| case-e-nils-review | 1.38M · 1.26M | 4 · 3 |
| case-f-globals-review | 2.22M · 1.60M | 6 · 6 |
| centerpiece-storify-review | 1.81M · 2.49M | 6 · 6 |
| mutation-leaf-review | 2.12M · 1.91M · 1.51M | 4 · 4 · 4 |
| review-full | 4.96M · 4.11M · 6.09M | 6 · 6 · 6 |
| controls and triggers (12 runs) | 0.05M to 0.18M | 0 |

Cheap tier 42.5M over 32 runs; without the new mutation case, **37.0M over the 29 runs
2.11.0 had, against 65.6M**, down 44 percent, against the program's target of 25M. Medium
tier 101.2M over 12 runs; without the new mutation case, 94.8M over 10 against the 65.9M
`docs/token-budget.md` recorded for the refactor tier, up 44 percent, carried by
`quickfix-red-lint` 24.3M, `case-f-globals-refactor` 16.3M, `prepare-sms` 15.7M and
`centerpiece-storify-refactor` 14.4M (finding 4).

Per agent kind, both tiers:

| agent | n | median turns | max turns | median Read calls | median result tokens |
|---|---|---|---|---|---|
| rule-hunter | 71 | 4 | 12 | 1 | 15.6k |
| comment-critic | 33 | 7 | 22 | 1 | 9.7k |
| overabstraction-skeptic | 15 | 4 | 17 | 0 | 8.0k |
| lint-fixer | 3 | 8 | 29 | 2 | 1.3k |

No hunter ran a detection command in any review run; their calls are reads of the bundle
and the judgment questions' searches. The report's attribution table (fixed context,
plugin text, repository work, spawns) reads 100 percent "subagents" for this run: the CLI
2.1.259 trace carries no main-thread `message_start` events the script keys on, so main-thread
calls and context sizes are not measured here. The instrument needs that field's new shape
before the next stage's per-tier attribution can be read; the per-run totals are the API's
own numbers and stand.

## Grader and prompt changes applied since c78b55f

- #37: `mutation-leaf-review` (cheap, 3 runs) and `mutation-leaf-kill` (medium, 2 runs);
  three `recall-R7.Q7.*` graders in review-full (111 → 114); R7 Q7 plants in the manifest.
- #38: `scripts/set-cmd-prefix.sh` runs on macOS (BSD `sed`, no `grep -Z`); without it
  every copied case kept the `{{cmd_prefix}}` token and the announcement grader failed.
- The changes between d22540c and #37 are in this repository's log.

## Infrastructure notes

- Ran on a macOS laptop kept awake by the desktop app, one `task go:run` per tier in one
  background shell, about seven hours in all. `ldd-eval run` exits 201 when any case is
  below the pass threshold; the exit code is not an error in the run.
- `gremlins` and `gocognit` are not installed on this machine. `mutation-leaf-kill`'s
  postcheck reads `999` for a package whose mutation run did not execute, so its 3/4 is not
  a verdict on the plugin; the centerpiece postcheck's `gocyclo` row (9, limit 8) is real.
  Install both before the medium tier is compared against this baseline.
- The cheap cap of $90 and the medium cap of $45 were not reached. Budget the cheap tier
  at $60 and the medium at $50 with the mutation cases.
- The plugin directory is read live by every `Skill` call; nothing was regenerated during
  this run — the checkout sat detached at b56f79b for both tiers.
