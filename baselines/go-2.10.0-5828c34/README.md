# Baseline go-2.10.0-5828c34 — cheap and medium tiers

Plugin `buzzdan/ai-coding-rules` at 5828c34 (v2.10.0), the first **generated** plugin
directory (rendered from `core/` and `lang/go/` by `tools/ldd-gen`; the rendered text is
byte-identical to the hand-written 681fdb0 plugin except one CHANGELOG line). The Go suite
as of this repository's commit `c6987ef` (branch `runner-clean-agent-env`), with the six
graders loosened in #2 re-applied afterwards by `ldd-eval regrade` (no agent re-spend). Agent model pinned to
`claude-sonnet-5`, judge `claude-haiku-4-5`, run 2026-09-10 from a Claude Code on the web
container (Linux), **Claude Code CLI 2.1.267**, agent sessions started with
`--setting-sources project,local` so no user-level hook or plugin reached them (every
trace has zero `hook_started` events).

*Superseded, 2026-09-15: [`go-2.11.0-c78b55f`](../go-2.11.0-c78b55f/README.md) is the reference from the close of Phase 2 on; its README compares every case with this one.*

This baseline replaces go-2.10.0-681fdb0 as the reference for Phase 2. It exists because the
behavioral re-run of the generated plugin from a developer machine was inconclusive (leaked
user hooks, then a different CLI version, OS and day); both baselines now come from the
same kind of environment, and the comparison below is the acceptance of Phase 1.5.

    task go:run TIER=cheap  CAP=1  CASE='trigger-*' OUT=results/go-rebaseline-5828c34 MODEL=claude-sonnet-5   # smoke
    task go:run TIER=cheap  CAP=80 RESUME=1        OUT=results/go-rebaseline-5828c34 MODEL=claude-sonnet-5
    task go:run TIER=medium CAP=30                 OUT=results/go-rebaseline-5828c34 MODEL=claude-sonnet-5
    task go:run TIER=medium CAP=35                 OUT=results/go-rebaseline-5828c34-m2 MODEL=claude-sonnet-5  # noise floor
    ldd-eval regrade --tag cheap  --out results/go-rebaseline-5828c34/cheap  <cases>
    ldd-eval regrade --tag medium --out results/go-rebaseline-5828c34/medium <cases>
    task go:baseline OUT=results/go-rebaseline-5828c34 PLUGIN=../ai-coding-rules/go-linter-driven-development

Every run's `result.json` is the regraded verdict. The trace archive `traces.tar.zst` is not in this repo. Copy it from the same path
in the private `weka/ldd-evals-traces` repo, then unpack it beside the verdicts before regrading:

    cd baselines/go-2.10.0-5828c34 && zstd -dc traces.tar.zst | tar -xf - -C .
    task go:regrade OUT=baselines/go-2.10.0-5828c34 TIER=cheap PLUGIN=<plugin dir>
    bin/ldd-eval regrade --tag medium --out baselines/go-2.10.0-5828c34/medium-2 <plugin dir>/evals   # the second pass

Graders that read the scaffold tree (files, postcheck, art judges) report "needs the kept
scaffold" from a clone; the transcript graders reproduce. Spend as recorded in each tier's
`aggregate-result.json` (agent plus judge): cheap **$39.72**, medium **$29.99**, second medium
pass **$42.68**; of that the judges cost $0.07, $0.44 and $0.35.

## Pass rates

| Case | Passed | Turns | Cost | Reads as |
|---|---|---|---|---|
| trigger-non-go | 3/3 | 1,1,1 | $0.12 | negative trigger control holds |
| trigger-go | 0/3 | 3,1,3 | $0.32 | names the skill, never invokes it or announces (unchanged, see 681fdb0 caveat) |
| case-a-retention-review | 1/2 | 34,32 | $2.38 | run 1: skeptic REFUTES `RetentionDays` at ~3 on its marginal-score bias; run 2 CONFIRMS `Retention` at 5 and names the domain-type fix (recorded 0/2 until the #7 regrade, see the erratum under finding 5) |
| case-b-endpoint-review | 0/2 | 46,42 | $3.26 | skeptic REFUTES `Endpoint` and `Scheme` |
| case-c-picker-review | 0/2 | 32,44 | $3.38 | skeptic REFUTES the leaf type; run 2 cites the flag evidence run 2 of 681fdb0 missed |
| case-d-ceremony-review | 2/2 | 44,37 | $3.33 | negative control: no extraction proposed; run 1 polled notifications across 6 segments |
| case-e-nils-review | 0/2 | 33,39 | $3.00 | both runs hoist the nil checks into the constructor and never offer the Null Object alternative; run 1 also skips the R11 fix name |
| case-f-globals-review | 1/2 | 74,42 | $6.82 | run 1 describes the exact move (`Load` returns a value, `main` passes it down) without naming Extract Clean Island / Push the Global Up |
| centerpiece-storify-review | 1/2 | 185,39 | $11.25 | run 1: 109 `ReadNotifications` calls, no R3 linter numbers; run 2 passes once the cluster-status graders accept the rule ids on the line after `CLUSTER: \`Status\`` |
| review-full | 0/3 | 57,10,9 | $5.80 | run 1: 90 of 111; runs 2 and 3 certified an **empty diff scope** without running a hunter (finding 1) |

Suite pass rate 0.35 (8 of 23 runs), average grader score 0.76 — 0.30 (7 of 23) and 0.75 as
first recorded; the #7 regrade of case-a and case-b review moved case-a run 2 to a pass.

## Comparison with go-2.10.0-681fdb0 (Phase 1.5 acceptance)

Same graders on both sides (the 681fdb0 verdicts are the regraded ones committed with that
baseline). Per case, the pass count and the graders whose verdict differs between old run
*i* and new run *i*:

| Case | 681fdb0 | 5828c34 | Differing graders | Reads as |
|---|---|---|---|---|
| trigger-non-go | 3/3 | 3/3 | 0 | identical |
| trigger-go | 0/3 | 0/3 | 0 | identical |
| case-a-retention-review | 0/2 | 0/2 | 1 + 1 (`cluster-retention-r1` ↓, `fix-domain-type` ↑) | noise (2 flipped between the old runs too) |
| case-b-endpoint-review | 0/2 | 0/2 | 1 (`evidence-dial` ↓ in run 2) | noise |
| case-c-picker-review | 0/2 | 0/2 | 1 (`evidence-flags` ↑ in run 2) | noise |
| case-d-ceremony-review | 2/2 | 2/2 | 0 | identical |
| case-e-nils-review | 1/2 | 0/2 | 2 + 4; `fix-null-object` ↓ in **both** runs, `fix-constructor` ↓, `cluster-find`/`r2-q2`/`r2-q5` ↑ | grader counts 12/14 and 11/14 vs 14/14 and 9/14: inside the old 5-grader band per run, but the Null Object miss is consistent (finding 3) |
| case-f-globals-review | 2/2 | 1/2 | 1 (`fix-clean-island` ↓) | wording: the fix is described, not named (finding 4) |
| centerpiece-storify-review | 2/2 | 1/2 | 1 (`r3-q1-linter-numbers` ↓ in run 1) | one grader inside a 185-turn polling run; run 2 failed the two cluster-status graders before #2 (the ids sit on the line after the header) and passes with them |
| review-full | 94, 92, 91 of 111 | 90, 21, 21 of 111 | run 1: 26 (the "misses move" pattern of 681fdb0: this run missed Case A and the R4/R5 package plants, found Case C and the R6/R7 test plants); runs 2 and 3: 72–73 | run 1 is one grader below the old 91–94 band; runs 2 and 3 are a behavior change in scope resolution, not recall (finding 1) |

Medium tier (first pass): nine of ten cases keep their verdict and their failing graders;
`quickfix-red-lint` moves 0/1 → 1/1 (finding 7) and `case-d-ceremony-refactor` 1/1 → 0/1 on a
single-vote art judge that passed live and failed on regrade (finding 8). Art judges pass on
the same two cases (A and B) in both baselines. The second pass (`medium-2/`) puts both of
those moves inside the noise floor: quickfix fails again there, case-d passes again.

**Verdict.** With one exception the deltas are inside the noise floor recorded with 681fdb0
(one flipping grader per case; the review-full band) or were graders that judged wording,
which #2 loosens. The exception is review-full runs 2 and 3, where the agent resolved the
review scope to "staged diff", found it empty and stopped. That is a real behavioral
difference between the two baselines, but the plugin text is byte-identical, so it cannot be
the generator: it is a latent contract gap in the review command (finding 1) that the
681fdb0 runs happened not to hit (0 of 3) and these did (2 of 3). The generated plugin is
accepted as behavior-equivalent; finding 1 is a Phase 2 target, and the eval case should
state the whole-repository scope explicitly so the case measures recall, not scope guessing.

## Findings about the plugin (Phase 2 targets, in order)

1. **The whole-repo review has no contract for a clean tree.** `/go-ldd-review` with no
   argument prints `git status --porcelain` and `git diff --stat` (both empty on the freshly
   committed fixture) and hands off to `pre-commit-review`, whose scope rule is "staged changes
   by default". Two of three runs followed that rule literally: tests and lint green, "Files in
   scope: none", no hunter, skeptic or critic spawned, 9–10 turns, $0.15, and a "Commit
   Readiness Report" that certifies an unreviewed repository. Run 1 (like all three 681fdb0
   runs) widened the scope to the whole tree on its own. Either the command must define the
   no-argument scope as the repository, or the skill must refuse to report clean on an empty
   scope. Until then the case's `review-full` signal is one run in three.

   *Errata, 2026-09-11.* The contract was decided the other way: the default scope is the
   checkout's changes, the ceiling is the current PR, and the whole repository is reviewed
   only when asked for explicitly (`--all`). Under that contract runs 2 and 3 were the
   correct behavior and run 1, which widened on its own, was the defect. The case now
   invokes `/go-ldd-review --all`, and `review-clean-tree` is the negative control that
   expects "nothing to review" from the bare command on this fixture. The three recorded
   verdicts stand as recorded; compare future `review-full` runs against run 1's 90 of 111.
2. **Headless sessions still wait badly** (681fdb0 finding 3). Four of 23 cheap runs spawned
   hunters without the foreground flag and then polled: centerpiece run 1 made 109
   `ReadNotifications` and 19 `ListAgents` calls over 4 segments (185 turns, $9.96, the same
   findings as the 39-turn run 2); case-d run 1 ran 6 segments, case-e run 1 4, review-full
   run 1 3. In the medium tier: case-a pass 1 3 segments, case-b pass 2 6, case-e pass 2 2,
   quickfix pass 2 5 (finding 7). `segments` above 1 in `result.json` is this pathology; the
   non-interactive note in every prompt does not prevent it.

   *Errata, 2026-09-12.* The cause was the host, not the plugin. The cloud container that
   recorded this baseline exports `CLAUDE_AUTO_BACKGROUND_TASKS=true`, the runner passed its
   whole environment to the agent, and under that flag claude turns any foreground `Agent`
   call still running after 120 seconds into a background task answered "Async agent
   launched"; every such conversion in the review traces sits at exactly 120.0 s and every
   inline hunter result under it. A developer's shell does not set the flag, so a foreground
   call there blocks until the hunter returns. The runner now strips the flag; the polling
   counts and `segments` above are the host's behavior and are not comparable with runs
   recorded after the fix.
3. **The Null Object alternative is gone from the nil-handling review.** Both case-e runs route
   `Reporter.Sink`/`Clock` to "unexport, resolve defaults once in `NewReporter`, delete the
   `Record()` re-checks" and never mention a null object (`DiscardSink`), which the manifest
   lists as the R11 companion fix and which 681fdb0's run 1 named. The refactor case shows the
   other half: its run introduced `type Sink interface` in `internal/report` (postcheck R6 Q1
   fail) instead of a null-object value.
4. **Reports describe fixes without naming the move.** case-f run 1 explains exactly the
   Extract Clean Island / Push the Global Up sequence ("`Load() (Configuration, error)`
   validates and returns a value; `main` constructs it once and passes values down") and the
   `fix-clean-island` grader, which wants the move name, fails. Same class as the six graders
   loosened in #2; `fix-clean-island` and the `fix-*` graders of cases A–E are the next
   candidates if the decision is to grade the described move rather than its name.
5. **The overabstraction skeptic still refutes narrow, valid extractions** (681fdb0 finding 1):
   cases A, B and C are 0/2 again with the skeptic scoring each proposed type 0–1, while the
   centerpiece's `Status` is CONFIRMED at 4 and the whole-repo review confirms `Alert.Channel`
   at 4 and refutes `Device.Status` in the same report.

   *Errata, 2026-09-14.* Half of case A was the grader, not the skeptic. Run 2's skeptic
   confirmed `Retention` at 5 and the report wrote `**CONFIRMED** (score 5`; the
   `skeptic-confirmed-4plus` grader wanted the literal `CONFIRMED (score` and failed it. #7
   lets the four verdict graders accept any punctuation between the word and the score and
   regrades case-a and case-b review from the archived traces (regex graders only, no judge
   spend): case-a run 2 passes, case-a is 1/2, case-b stays 0/2 (both runs REFUTED at 0–1),
   and the cheap aggregate is rebuilt from every `result.json`. Run 1's refutation at a
   marginal ~3 stands as the skeptic finding this item describes.
6. **The trigger does not fire headless** (681fdb0 finding 5): all three trigger-go runs read
   one or two files and answered in 1–3 turns without a `Skill` call or the announcement.
7. **Quickfix has no stopping rule, and its outcome is a coin flip** (681fdb0 finding 9). Pass 1:
   49 turns, $15.05, finished with a report (681fdb0: 121 turns to the cap, $7.65, no report). Lint went 48 → 27 → 1 (the remaining `ireturn` argued as a
   genuine two-implementation interface), 10 escalations were routed through the refactoring
   skill (`device_service.go` split four ways, `ProcessHeartbeat` storified into nine functions,
   globals removed from `env.go` and `registry.go`), the review pass then found and fixed two
   real bugs (a `flushLoop` goroutine leak and the missing PagerDuty case in `validRecipient`),
   every test assertion was kept and no `//nolint` added. Nothing was committed: "all changes
   are staged" (681fdb0 finding 10 holds). Pass 2 on the same fixture: 302 turns over 5
   self-resumed segments, 160 `ReadNotifications` calls, $27.29, all 33 lint findings fixed
   but `internal/utils` dissolved with its test file (170 of 173 assertions survive, the
   681fdb0 failure mode) and again no commit. Same command, same code, $15 pass and $27 fail:
   the stopping rule is the turn budget and the waiting pathology, not a judgment.
8. **Single-vote llm judges flip** (681fdb0 finding 12, again): `art-judge` on the case-d
   refactor passed live and failed on regrade in pass 1 (the judge read the pre-existing
   `SetStatus`/`Line()`/`Days()` accessors in untouched fixture files as new indirection),
   then failed live and passed on regrade in pass 2, on code that in both passes deleted
   `grants.go` and added nothing. `main-reads-as-a-story` on case-f passed live and failed on
   regrade in pass 2, exactly as in 681fdb0. The recorded verdicts are the regraded ones;
   read case-d as 1/1 on the code and a coin flip on the judge.
9. **Refactors still stop at "mechanically fixed"** (681fdb0 finding 8), with the same failing
   graders as before on cases C, F and the centerpiece (no collection type / no comma-ok
   query; `main-reads-as-a-story`; `gone-five-results`, `gone-force-saves`,
   `gone-region-byte-slice`), and the R6-interface variant on case E (finding 3).

Unchanged and still true: the skeptic finds real unplanted bugs along the way (run 1 of
review-full and the quickfix run both found the `flushLoop` race and the PagerDuty
rejection); prepare-sms passes every gate with one prep commit; wire-repo-brain wires the
OKF bundle and its check passes.

## Noise floor

Graders that flip between runs of the same case in this baseline: case-a 2, case-b 1,
case-c 1, case-d 0, case-e 3, case-f 1, centerpiece 3, trigger cases 0; review-full 71 — but
that number is the two empty-scope runs against one real run, not recall variance. For the
whole-repo review use run 1 alone (90 of 111) next to the 681fdb0 band of 91–94 until the
case states its scope.

Medium tier, two passes (`medium/` and `medium-2/`), same graders, both regraded:

| Case | Pass 1 | Pass 2 | Graders that differ |
|---|---|---|---|
| case-a-retention-refactor | 5/5 | 5/5 | 0 |
| case-b-endpoint-refactor | 4/4 | 4/4 | 0 |
| case-c-picker-refactor | 4/8 | 4/8 | 0 |
| case-d-ceremony-refactor | 3/4 | 4/4 | 1 (`art-judge`, finding 8) |
| case-e-nils-refactor | 6/9 | 3/9 | 3 (`default-constructor-exists`, `gone-nil-args-to-newreporter`, `gone-opts-clock-nil-checks`: pass 2 did not add the defaults) |
| case-f-globals-refactor | 3/6 | 3/6 | 0 |
| centerpiece-storify-refactor | 6/11 | 5/11 | 1 (`single-altitude`, llm judge) |
| prepare-sms | 5/5 | 5/5 | 0 (pass 2 wrote "Gates: multiply ✓", which failed the case-sensitive `multiply-gate` before #2) |
| quickfix-red-lint | 8/8 | 7/8 | 1 (`postcheck`, finding 7) |
| wire-repo-brain | 10/10 | 10/10 | 0 |

Pass rates 0.50 and 0.50; art judges 2 of 7 and 3 of 7. Judge flips between the live run
and the regrade of the same trace: case-d `art-judge` in both passes (opposite directions),
case-f `main-reads-as-a-story` in pass 2.

For the next comparison, treat a per-case change smaller than one flipping grader as noise,
compare review-full on its grader count, and read a single-vote judge flip (finding 8) as
noise until the 2-of-3 vote exists.

## Grader calibration applied after the run

The first regrade re-applied the graders that ran live: no cheap-tier verdict changed; in
the medium tier the one flip was the case-d art judge (finding 8). Then the six graders
loosened in #2 (the review-full cluster and `env.go` recall graders, the centerpiece
`cluster-status-r1`/`-r11` and `critic-ran`, prepare-sms `multiply-gate`, case-d
`cheaper-alternative-int`) were re-applied to the cases they belong to, and only those,
so the llm judges of unrelated cases did not re-roll. They change exactly three grader
verdicts and two case verdicts: centerpiece-storify-review run 2 (both cluster-status
graders, the case reads 1/2) and prepare-sms in `medium-2/` (`multiply-gate`, 1/1 in both
passes). go-2.10.0-681fdb0 is regraded with the same graders in the same pull request; no
verdict changed there.

## Medium tier (`medium/`, second pass in `medium-2/`)

Pass 1: one invocation over the tier with `--keep-temp` and a cumulative $30 cap, which the
run ended $0.07 under. Same model pins. Pass 2 (`medium-2/`, run for the noise floor above):
the same invocation into a second directory with `CAP=35`, which quickfix alone pushed past
($27.29); `--resume` with `CAP=45` then ran the remaining wire-repo-brain. Pass 2 verdicts:
case-a, case-b, case-d, prepare-sms and wire-repo-brain pass; the rest fail. The table is pass 1.

| Case | Passed | Art judge | Turns | Cost | Reads as |
|---|---|---|---|---|---|
| quickfix-red-lint | 1/1 | — | 49 | $15.05 | finished with a report: lint 48 → 1, 10 escalations routed, two real bugs fixed, assertions kept, nothing committed (finding 7) |
| prepare-sms | 1/1 | — | 60 | $1.54 | PREPARATION LOG, MULTIPLY gate named, R11 named, skeptic consulted |
| wire-repo-brain | 1/1 | — | 41 | $1.19 | OKF bundle wired and the check script passes |
| case-a-retention-refactor | 1/1 | PASS | 67 | $2.21 | `Retention` extracted with its parser; `Prune` reads as a story (3 segments) |
| case-b-endpoint-refactor | 1/1 | PASS | 45 | $1.52 | unexported `endpoint` value; scheme decided once |
| case-c-picker-refactor | 0/1 | FAIL | 27 | $0.56 | flags still drive the logic; no collection type, no comma-ok query, not single-altitude |
| case-d-ceremony-refactor | 0/1 | FAIL | 22 | $0.32 | deleted the unreferenced `grants.go`, added nothing; passed live, the regraded judge counted pre-existing accessors as new indirection (finding 8) |
| case-e-nils-refactor | 0/1 | FAIL | 82 | $3.02 | constructor validates, defaults called; but a `Sink` interface was introduced (R6 Q1 postcheck) and nil is still representable |
| case-f-globals-refactor | 0/1 | FAIL | 95 | $2.15 | `Config` global gone, `Load` returns a value; `main` still does not read as a story, postcheck fails |
| centerpiece-storify-refactor | 0/1 | FAIL | 61 | $1.99 | behavior preserved and complexity down, but five results, `force` saves and the region byte slice remain |

Tier pass rate 0.50 (5 of 10) after regrade (0.60 live), average grader score 0.80. Art
judges: 2 of 7 PASS (3 of 7 live). Pass 2: 0.50 (5 of 10) after regrade, score 0.77, art judges
3 of 7.

## Infrastructure notes

- The runner and the second `claude -p` agent it spawns must be detached (`setsid nohup`)
  from the session's tool call; a tool-bound background command is killed with its
  10-minute timeout. One case-a run was lost that way before the detached relaunch and
  redone under `--resume` (its partial directory was removed first; a directory without
  `result.json` is re-run either way).
- The container was not reclaimed during this session; a scheduled check-in every 45
  minutes stood ready to relaunch with `--resume`.
- `zstd`, `rsync` and `task` are not in the web container image; `apt-get install zstd rsync`
  and `go install github.com/go-task/task/v3/cmd/task@latest` before `task go:run`.
- The medium cap of $30 was reached within seven cents because `quickfix-red-lint` cost
  $15; the second pass ran with `CAP=35`, which the $27 quickfix run exceeded before
  wire-repo-brain, finished under `--resume` with `CAP=45`. Budget the medium tier at $45.
