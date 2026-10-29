# Baseline go-2.11.0 — cheap and medium tiers, the close of Phase 2

Plugin `buzzdan/ai-coding-rules` at **2.11.0**. The run executed against main at `23bd9ad`
(the merge of #37, the last Phase 2 PR); 2.11.0 is the release commit on top of it and
changes only the version fields — every rule, skill, agent and command is byte-identical
to 23bd9ad. The Go suite as of this repository's `d22540c` (after #7, #8 and #9). Agent
model pinned to `claude-sonnet-5`, judge `claude-haiku-4-5` voting 2 of 3 (runner #7), run
2026-09-15 from a Claude Code on the web container (Linux), **Claude Code CLI 2.1.273**,
`CLAUDE_AUTO_BACKGROUND_TASKS` stripped by the runner (#6): every run has `segments: 1`.

This baseline replaces go-2.10.0-5828c34 as the reference. It is the "after" of Phase 2
(plugin PRs #34, #35, #36, #37) and the "before" of Phase 3a, the generic binding: a
Phase 3a change is accepted when the same cases give the same verdicts against it.

    task go:run TIER=cheap  CAP=50 OUT=results/go-baseline-23bd9ad MODEL=claude-sonnet-5
    task go:run TIER=medium CAP=55 OUT=results/go-baseline-23bd9ad MODEL=claude-sonnet-5
    task go:run TIER=cheap  CAP=3  CASE='trigger-*' OUT=results/go-baseline-23bd9ad MODEL=claude-sonnet-5
    # the cheap cap was reached after review-full run 3, before the trigger cases; they ran
    # separately and the cheap aggregate was rebuilt from every run-N/result.json
    PLUGIN_SHA=c78b55f PLUGIN_VERSION=2.11.0 scripts/promote-baseline.sh results/go-baseline-23bd9ad ../ai-coding-rules/go-linter-driven-development

One medium pass, not two: the noise floor below reuses 5828c34's two-pass measurement and
adds the same-head swings observed during the Phase 2 PRs. Spend (agent plus judge):
cheap **$54.36** over 29 runs, medium **$24.83** over 10 runs; judges $0.29 and $0.68.

The trace archive `traces.tar.zst` is not in this repo. Copy it from the same path
in the internal `weka/ldd-evals-traces` repo, which only WEKA members can open, then unpack it beside the verdicts before regrading:

    cd baselines/go-2.11.0-c78b55f && zstd -dc traces.tar.zst | tar -xf - -C .

Graders that read the scaffold tree (files, postcheck, art judges) report "needs the kept
scaffold" from a clone; the transcript graders reproduce.

## Pass rates

Cheap tier (`cheap/`), runs passing every grader:

| Case | Passed | Turns | Cost | Reads as |
|---|---|---|---|---|
| trigger-non-go | 3/3 | 1,1,1 | $0.12 | negative trigger control holds |
| trigger-go | 3/3 | 4,4,4 | $0.28 | skill invoked and announced in every run (0/3 in 5828c34; prompt reworded in #7) |
| case-a-retention-review | 1/2 | 24,25 | $2.32 | 13/13 then 11/13: run 2 found `Retention` but rendered no cluster for it |
| case-b-endpoint-review | 0/2 | 24,43 | $2.89 | 13/15 both runs; `fix-name-enum` misses both (finding 4) |
| case-c-picker-review | 2/2 | 36,31 | $3.28 | skeptic confirms `Nodes`, flag loop and leaf type named (0/2 in 5828c34) |
| case-d-ceremony-review | 2/2 | 29,30 | $2.87 | negative control: no extraction proposed, in both runs |
| case-e-nils-review | 1/2 | 22,31 | $3.10 | 13/14 then 14/14: run 1 rendered no `Reporter` cluster |
| case-f-globals-review | 2/2 | 41,45 | $6.11 | Extract Clean Island / Push the Global Up named |
| centerpiece-storify-review | 2/2 | 57,43 | $7.79 | `Status` cluster with its rule ids, R3 linter numbers |
| review-clean-tree | 3/3 | 6,3,4 | $0.27 | scope control: "nothing to review", `--all` named, no agent |
| quickfix-clean-tree | 3/3 | 3,3,3 | $0.22 | scope control (new in #9): "nothing in scope to fix", no agent, no edit |
| review-full | 0/3 | 54,63,68 | $24.83 | **104, 103, 53 of 111**; run 3 wrote its report to a file (finding 2) |

Medium tier (`medium/`), one run each, graders passed:

| Case | Graders | Turns | Cost | Reads as |
|---|---|---|---|---|
| case-a-retention-refactor | 5/5 | 54 | $1.76 | |
| case-b-endpoint-refactor | 4/4 | 85 | $3.07 | |
| case-c-picker-refactor | 5/8 | 42 | $1.08 | no `Nodes` collection type this run (8/8 the same morning at 20bd50c, finding 1); committed, clean tree |
| case-d-ceremony-refactor | 3/4 | 18 | $0.44 | art judge reads the fixture's pre-existing `Handler` as new indirection (5828c34 finding 8) |
| case-e-nils-refactor | 8/9 | 51 | $1.73 | `WithSink(nil)` records the error, `NewReporter` returns `errors.Join`; art judge on comments |
| case-f-globals-refactor | 3/6 | 73 | $1.50 | `Config` global gone in 4 commits; `var region` and `init()` left with their suppressions this run (finding 1) |
| centerpiece-storify-refactor | 5/11 | 51 | $2.22 | committed and clean; five results, `changed \|\| force`, sentinel and region slice left, `ParseHeartbeatLine` not reused (9/11 the same morning at 3d5c8cb, finding 1) |
| prepare-sms | 5/5 | 96 | $3.21 | all four gates, one prep commit |
| quickfix-red-lint | 8/8 | 26 | $7.75 | scoped to `internal/services internal/env` (#9); FIXED/ESCALATED lines rendered; assertions kept |
| wire-repo-brain | 10/10 | 43 | $1.38 | |

Pass rates: cheap 0.76 (22 of 29 runs), medium 0.50 (5 of 10); average grader score 0.96
and 0.82.

## Comparison with go-2.10.0-5828c34

Same graders where nothing changed; where a grader or a prompt changed between the two
baselines the row says so. Runs passing all graders, then the grader-level view.

| Case | 5828c34 | 2.11.0 | Grader level | Reads as |
|---|---|---|---|---|
| trigger-go | 0/3 | 3/3 | `announcement`, `skill-invoked` ×3 → pass | prompt reworded in #7 (dry-run instruction dropped); the plugin's trigger was never the problem |
| trigger-non-go | 3/3 | 3/3 | identical | |
| case-a-retention-review | 1/2 | 1/2 | 10/13 · 13/13 → 13/13 · 11/13 | skeptic now confirms `Retention` in both runs; the cluster render is the flip |
| case-b-endpoint-review | 0/2 | 0/2 | 10/15 · 9/15 → 13/15 · 13/15 | `fix-parameter-object`, `r1-q5-clump`, `skeptic-confirmed` now pass; `fix-name-enum` still misses (finding 4) |
| case-c-picker-review | 0/2 | 2/2 | 9/10 · 8/10 → 10/10 · 10/10 | the skeptic's fourth axis (#34) |
| case-d-ceremony-review | 2/2 | 2/2 | identical | the control the fourth axis had to keep |
| case-e-nils-review | 0/2 | 1/2 | 12/14 · 11/14 → 13/14 · 14/14 | `fix-null-object`, `fix-constructor`, `r2-q6-nil-args` now pass |
| case-f-globals-review | 1/2 | 2/2 | 13/14 · 14/14 → 14/14 · 14/14 | the move is named, not described (#35's fix-name rule) |
| centerpiece-storify-review | 1/2 | 2/2 | 11/12 · 12/12 → 12/12 · 12/12 | |
| review-clean-tree | 3/3 | 3/3 | identical | |
| review-full | 90 · 21 · 21 | 104 · 103 · 53 | run 1 vs runs 1–2: +14 and +13 graders; the header reconciles every hunter (`R1 8/8 · … · R12 4/4`) in all three runs | runs 2–3 of 5828c34 were the empty-scope defect (#30); run 3 here is finding 2 |
| case-a-retention-refactor | 5/5 · 5/5 | 5/5 | identical | |
| case-b-endpoint-refactor | 4/4 · 4/4 | 4/4 | identical | |
| case-c-picker-refactor | 4/8 · 4/8 | 5/8 | `comma-ok-query` now passes; collection type absent in this run; new commit assertions pass | prompt now asks for the commit (#8) |
| case-d-ceremony-refactor | 3/4 · 4/4 | 3/4 | art judge, as in pass 1 | |
| case-e-nils-refactor | 6/9 · 3/9 | 8/9 | `nil-unrepresentable`, `postcheck`, `default-constructor-exists`, `gone-nil-args-to-newreporter`, `gone-opts-clock-nil-checks` now pass | prompt asks for the commit; `gone-nil-args` narrowed to positional nil (#8) |
| case-f-globals-refactor | 3/6 · 3/6 | 3/6 | same three graders | |
| centerpiece-storify-refactor | 6/11 · 5/11 | 5/11 | `gone-minus-one-sentinel` lost, `single-altitude` regained; new commit assertions pass | prompt asks for the commit (#8) |
| prepare-sms | 5/5 · 5/5 | 5/5 | identical | |
| quickfix-red-lint | 8/8 · 7/8 | 8/8 | `postcheck` passes; $7.75 and 26 turns against $15.05 · $27.29 and 49 · 302 turns | prompt scoped to two packages (#9); not comparable on scope or cost |
| wire-repo-brain | 10/10 · 10/10 | 10/10 | identical | |

No case regressed. The review path moved as a block: every scoped review is at or above
its reference and the whole-repository review gained thirteen to fourteen graders in the
runs that delivered a report. The refactor path moved where a grader measures a contract
(commits, the options pattern, the skeptic's scope) and stayed where it measures whether
the stopping criteria were followed in that particular run (finding 1).

## Findings about the plugin (Phase 3 targets, in order)

1. **The refactor path's outcome varies run to run at one head.** During the Phase 2 PRs,
   against text identical to this baseline: case-c-picker-refactor 8/8 (20bd50c, morning)
   and 5/8 here; centerpiece-storify-refactor 9/11 (3d5c8cb, morning) and 5/11 here;
   case-f-globals-refactor removed `var region` and `init()` at 3d5c8cb and left them here.
   The six-step stopping criteria (detection re-run, noun check, critic) are applied in
   some runs and skipped in others, and the `Stop check` block that would make the skip
   visible has never rendered in any run. The review path does not have this problem: its
   report contract is read by the graders directly and the reconciliation header renders
   every time. The next gain on refactoring is making the `Stop check` block render like
   the review header does — a contract the caller reads, not a checklist the model may
   follow.
2. **A whole-repository review can offload its report to a file.** review-full run 3 did the
   same work as runs 1 and 2 (12 hunters, skeptic, critic, header reconciled) and then
   wrote a 36 KB report to a scratchpad file with the Write tool and sent a 2 KB summary
   ending "it's in the report I just sent you". Runs 1 and 2 put the 30 KB report in the
   message. The graders read the message; `no-write` also fired. The review skill says
   "never edits code" and nothing about where the report goes. Fix: the report is the final
   message, never a file, never a summary pointing at one.
3. **Four cluster graders fail in every whole-repository run**, for two different reasons.
   `Catalog.Find` and the retention plants are recall misses: in run 1 no hunter finding
   names `Catalog.Find` (it appears only inside the suggested commit message) and nothing
   names retention at all (`recall-CASE-A.zero-sentinel` fails with it); the R2 hunter's
   nil-return question and the R1 hunter's sentinel question did not fire on the whole
   repository where they fire on the scoped diff (case-a and case-e reviews pass them).
   `Reporter` and the role-named packages are convergence misses: `reporter.go` carries two
   R2 findings and `internal/common` / `internal/utils` carry R4 findings and an R5 finding,
   all rendered as singletons under their rules, but no `🔗 CLUSTER` entry for either
   anchor — while `ProcessHeartbeat`, `Alert.Channel`, `Device.Status`, `Job.Kind`, `Cache`
   and `models.Device` all render as clusters in every run. The cluster pass (#35) works
   where the convergence is on one type's methods and misses it where the anchor is a
   package or a type whose findings sit on different lines of one file.
4. **The R1 precision control `Tenant` fires in every whole-repository run**, as it did in
   5828c34 and the review-full triples between: a hunter cites `Tenant` as evidence while
   clearing it, and the grader counts a mention. Owner decision pending: count citations as
   mentions (then the plugin must not name a cleared symbol) or exempt evidence lines.
5. **Case B never names R1's "Name enum strings" for the two-value scheme string.** Both
   runs found the byte-identical `scheme := "http"; if tls { scheme = "https" }` in `Get`
   and `healthURL`, routed it to R11 as a duplicated switch and proposed a private
   `scheme()` helper — dedupe, not a type. A string that takes two values and is compared
   in two places is R1 Q3; the fix pattern is `type Scheme` with named constants.
6. **The D art judge reads fixture code as new indirection** (5828c34 finding 8, again):
   the pre-existing `Handler` struct in `internal/handlers/trace.go` is called "significant
   new structure". With 2-of-3 voting the judge failed both votes, so this is the rubric,
   not variance: the rubric should name the fixture's existing types as given.
7. **The refactor path commits only when the prompt asks.** Measured across five
   centerpiece runs during #36: with "Commit the result." absent, four runs ended with the
   green tree uncommitted, the last citing the harness's own "commit only when the user
   asks"; with it present (this baseline), every refactor case committed and left a clean
   tree. Bounded by the harness, stated in the plugin's changelog, and every refactor prompt
   now asks (#8).

Unplanted bugs the plugin keeps finding: the `flushLoop` goroutine leak and the `lastSeen`
map race in `device_service.go`, the missing PagerDuty case in `validRecipient`, the
`NewClient` silent port default; quickfix-red-lint fixed the race and a negative-batch
panic in its second commit.

## Noise floor

Measured in 5828c34 with two medium passes: one flipping grader per case (three on case E
and the centerpiece), art judges flipping between live run and regrade. Two things have
changed since: the llm judges vote 2 of 3 (#7), which removed the single-vote flips, and
the same-head swings above (finding 1) are larger than one grader on the refactor cases:
C 8/8 ↔ 5/8, centerpiece 9/11 ↔ 5/11, F 3/6 with different graders. For the cheap tier this
baseline's own two runs per case flip on: case-a 2 (`cluster-retention-r1`, `-r2`), case-b 2
(`evidence-dial`, `skeptic-travels-together`), case-e 1 (`cluster-reporter`), the rest 0;
review-full runs 1 and 2 differ on 4 graders (`judge-categories`, `recall-CASE-A.zero-sentinel`,
`recall-R1.Q3.raw-channel-string`, one direction each).

For the Phase 3a comparison: treat a scoped-review change of one grader as noise and two
as a signal; treat a review-full change inside 100–106 as noise; on a refactor case, a
change of up to three graders on C, F or the centerpiece is inside the observed swing and
needs a second run before it is read as a regression ($1–3 each); a change on A, B,
prepare-sms, quickfix or wire-repo-brain of any size is a signal, they have not flipped.

## Grader and prompt changes applied since 5828c34

- #7: `Judge.Vote`, 2-of-3 for every llm grader; skeptic graders accept `**CONFIRMED** (score 5`
  and `CONFIRMED, score 8`; `trigger-go` prompt reworded; Case D control `Grants` given a
  real caller. 5828c34 was regraded and carries the erratum.
- #8: case-c, case-e and centerpiece postchecks assert one commit after the scaffold base and
  a clean tree; their prompts end with "Commit the result."; case-e's `gone-nil-args-to-newreporter`
  matches positional nil only; `nil-unrepresentable` accepts `errors.Join` over recorded
  option errors.
- #9: `quickfix-red-lint` runs `/go-ldd-quickfix internal/services internal/env`;
  `quickfix-clean-tree` control added.

## Infrastructure notes

- The web container is reclaimed when the session idles, and a detached `setsid nohup`
  run dies with it: three runs were lost that way during the Phase 2 PRs. This baseline ran
  in one sitting with a `Monitor` on the log re-armed every 30 minutes, which kept the
  container alive for the full seven hours.
- The cheap cap of $50 was reached after review-full run 3 ($53.97 spent), so the runner
  stopped before `trigger-go` and `trigger-non-go`; they ran in a second invocation
  (`CASE='trigger-*'`), which rewrote `cheap/aggregate-result.json` with only those two
  cases; the aggregate was rebuilt from every `run-N/result.json` (12 cases, 29 runs).
  Budget the cheap tier at $60 and the medium tier at $30 with the scoped quickfix.
- `ldd-eval run` exits 201 when any case is below the pass threshold; the exit code is
  not an error in the run.
- The plugin directory is read live by every `Skill` call: a `task generate` in the plugin
  checkout while a run is in progress changes the text later cases see. Nothing was
  regenerated during this run.
