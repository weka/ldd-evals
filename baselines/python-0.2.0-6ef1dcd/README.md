# Baseline python-0.2.0-6ef1dcd — the Python plugin over py-mini, cheap tier

Plugin `python-linter-driven-development` (the Python binding, command prefix `py-ldd`)
from `buzzdan/ai-coding-rules` at **0.2.0**, main at `6ef1dcd` (the merge of #52, the six
case studies rendered in Python; #51 brought the Python canonical examples, falsifying
questions, ruff and mypy routing, the pytest testing skill and the docstring menus). The
Python suite as of this repository's `573aeb1` (after #32, the re-planted
`CASE-E.nil-return`). Agent model pinned to `claude-sonnet-5`, judge `claude-haiku-4-5`
voting 2 of 3, run 2026-09-19 to 2026-09-20 from a Claude Code on the web container
(Linux), **Claude Code CLI 2.1.278**; every run has `segments: 1`.

This is the Python binding's first baseline. It is read against
`generic-pymini-0.1.0-5890313`: the same core rendered without Python knowledge, measured
on the same fixture with the same model pin. The difference between the two is what the
binding adds.

    task py:run TIER=cheap CAP=70 OUT=results/python-floor MODEL=claude-sonnet-5 PLUGIN=../ai-coding-rules/python-linter-driven-development
    task py:run TIER=cheap CAP=75 OUT=results/python-floor MODEL=claude-sonnet-5 PLUGIN=../ai-coding-rules/python-linter-driven-development RESUME=1
    task py:baseline OUT=results/python-floor PLUGIN=../ai-coding-rules/python-linter-driven-development

Cheap tier, two invocations: review-full run 3 hit the case's 2400 s timeout in the first
pass and was re-executed by the second ("Infrastructure notes" below). Recorded spend
(agent plus judge): **$70.85** over 29 runs, judges $0.33. The timed-out run is not in
that figure; its trace volume matches the finished review-full runs, so the money spent
was about $81. The generic plugin's run on the same fixture cost $62.42.

**Verdicts are as recorded.** No grader changed between this run and its promotion; the
three fixes the generic baseline lists (#28, #29, #30) were in the suite before this run.
The trace archive `traces.tar.zst` is not in this repo. Copy it from the same path
in the internal `weka/ldd-evals-traces` repo, which only WEKA members can open, then unpack it beside the verdicts before regrading:

    cd baselines/python-0.2.0-6ef1dcd && zstd -dc traces.tar.zst | tar -xf - -C .

## Pass rates

Cheap tier (`cheap/`), runs passing every grader:

| Case | Passed | Turns | Cost | Reads as |
|---|---|---|---|---|
| trigger-py | 3/3 | 6,6,4 | $0.32 | announced, skill invoked, pre-flight listed `task test` (pytest) and `task lint` (ruff, mypy), DONE |
| trigger-non-py | 3/3 | 1,1,1 | $0.12 | control under the two-sentence prompt; not a trigger measurement for this plugin |
| case-a-retention-review | 1/2 | 25,25 | $2.89 | 12/13 then 13/13: the `Retention` cluster rendered in both runs; run 1 filed the `config.py` sentinel under R1 Q4 inside it, so the cluster's R2 half did not match |
| case-b-endpoint-review | 0/2 | 34,33 | $4.20 | 12/15 then 14/15: `evidence-dial` wants the literal `_dial(` and both reports wrote `_dial` bare; run 2 named both moves, run 1 named neither |
| case-c-picker-review | 1/2 | 29,24 | $3.68 | 10/10 then 9/10: the flag-driven loop found in both runs; run 2's skeptic refuted the extraction (score 0) and shipped a predicate plus `next()` instead, so Extract Leaf Type was not named |
| case-d-ceremony-review | 2/2 | 32,32 | $3.40 | 12/12 both runs; the control held |
| case-e-nils-review | 2/2 | 35,26 | $4.83 | 13/13 both runs: R2 Q5 fired on the malformed-line `return None` in `parse_device`, fix "Separate Failure from Absence", `Catalog.find` left alone |
| case-f-globals-review | 2/2 | 46,53 | $8.51 | 14/14 both runs; `_drain()` never cited |
| centerpiece-storify-review | 1/2 | 33,50 | $10.72 | 12/12 then 11/12: run 2 pointed at the three section comments by line number without quoting them |
| review-clean-tree | 3/3 | 6,5,3 | $0.24 | scope control: "nothing to review", `--all` named, no agent |
| quickfix-clean-tree | 3/3 | 3,3,3 | $0.22 | every grader passed; the #28 postcheck path fix holds |
| review-full | 0/3 | 55,51,49 | $31.41 | **106, 106, 104 of 110**; the report was the final message in all three runs |

**A regrade with the current graders** counts one more grader in review-full:
`recall-R5.Q7.models-file-count`. It needs the package-size row that the detection pass
writes for R5 question 7. This plugin does not write it, so the grader fails by design:
read it as new capability, not as a regression.

Pass rate 0.72 (21 of 29 runs), average grader score 0.98. The generic plugin on the same
fixture recorded 0.41 (12 of 29), 0.55 after a regrade with #28 to #30, which this run
already carries. Nine of the fourteen scoped review runs are at full marks here; the
generic baseline had three (four under #30).

## Comparison with generic-pymini-0.1.0-5890313

Same fixture, same model pin, the Python binding against the generic one. Runs passing all
graders, then the grader level; the generic column is that baseline's recorded verdict,
with the regrade in parentheses where #28 to #30 change it.

| Case | generic | python | Grader level | Reads as |
|---|---|---|---|---|
| trigger-* | 3/3 · 3/3 | 3/3 · 3/3 | identical | the Python skill triggers under the invoking prompt as the generic one did |
| case-a | 0/2 | 1/2 | 10/13 · 11/13 → 12/13 · 13/13 | the `Retention` cluster rendered in both runs (finding 2) |
| case-b | 0/2 | 0/2 | 13/15 · 11/15 → 12/15 · 14/15 | run 2 named both moves the generic plugin never named on either fixture; `evidence-dial` is a grader-wording miss in both runs |
| case-c | 1/2 | 1/2 | 8/10 · 10/10 → 10/10 · 9/10 | the flag loop found in both runs (finding 3); the one miss is a skeptic refutation, not a blind spot |
| case-d | 1/2 (2/2) | 2/2 | 11/12 · 12/12 → 12/12 · 12/12 | identical under #30 |
| case-e | 0/2 | 2/2 | 13/14 · 11/14 → 13/13 · 13/13 | **not the same plant**; see "Case E" below |
| case-f | 1/2 | 2/2 | 14/14 · 13/14 → 14/14 · 14/14 | no control citation this time |
| centerpiece | 0/2 | 1/2 | 11/12 · 11/12 → 12/12 · 11/12 | the same block-comments miss as generic run 1, once; the `Status` cluster miss did not recur |
| review-clean-tree | 3/3 | 3/3 | identical | |
| quickfix-clean-tree | 0/3 (3/3) | 3/3 | 5/6 ×3 → 6/6 ×3 | identical under #28 |
| review-full | 106 · 104 · 103 of 111 | 106 · 106 · 104 of 110 | same level | #32 removed `cluster-catalog-find`, which every generic run missed, so the generic runs read 107 · 105 · 104 of 110; recall is 219/222 against 215/222 |

On the eleven cases that are the same in both baselines, the Python binding is ahead at
the grader level in five (a, b, c, f, the centerpiece), equal in the rest, and behind in
none. The scoped reviews that lost one grader per run under the generic plugin mostly hold
full marks here; where a grader is still lost, the finding it guards is in the report
under another name or another rule id (cases a, b, c). review-full is at the same level:
the recall gain is real (four ids, "The parity report" below), the cluster and precision
misses are the same ones. Cost: $70.85 recorded against $62.42, with review-full at $31.41
against $29.63 and the centerpiece at $10.72 against $11.10; the scoped cases ran longer
(24 to 53 turns against 21 to 49) and case F cost $8.51 against $5.26.

### Case E is not the same fixture in the two baselines

The generic run measured `Catalog.find` returning `Device | None` as the plant
(`CASE-E.nil-return` before #32) and neither run flagged it. #32 re-planted the id as
`parse_device` in the same module, which returns `None` for a blank line (an absence) and
again for a malformed line (a failure); the anchor is the failure return and the review
fix is "Separate Failure from Absence"; the `cluster-find` grader is gone, so the case has
13 graders where it had 14. The case E rows above therefore compare a case whose plant
the fixture's own answer key has since withdrawn against a case with a new plant. Compare
the other eleven cases directly; case E stands on its own: the Python plugin found the new
plant in both scoped runs at `catalog.py:50-51`, named the fix with the split the oracle
wants ("raise for malformed input; keep `None` for the blank line"), and treated `find`'s
`Device | None` as the declared absence it is (run 2: "`Device | None` already signals a
possible miss", in a docstring DELETE line and nowhere else).

## The parity report

Recall per rule over the review-full recall graders (74 per run, three runs), the same
149 manifest ids, the two plugins on py-mini; the generic plugin's go-mini column from
`generic-gomini-0.1.0-109b0db` for scale:

| Rule | python on py-mini | generic on py-mini | generic on go-mini |
|---|---|---|---|
| R1 | 33/33 | 32/33 | 33/33 |
| R2 | 12/12 | 12/12 | 12/12 |
| R3 | 9/9 | 9/9 | 9/9 |
| R4 | 15/15 | 14/15 | 15/15 |
| R5 | 14/15 | 12/15 | 15/15 |
| R6 | 18/18 | 18/18 | 17/18 |
| R7 | 12/12 | 12/12 | 12/12 |
| R8 | 15/15 | 15/15 | 15/15 |
| R9 | 24/24 | 24/24 | 24/24 |
| R10 | 6/6 | 6/6 | 6/6 |
| R11 | 18/18 | 18/18 | 18/18 |
| R12 | 9/9 | 9/9 | 9/9 |
| case plants | 34/36 | 34/36 | 36/36 |
| **total** | **219/222 (0.986)** | **215/222 (0.968)** | **221/222 (0.995)** |

The ids missed here, with the runs that named them: `R5.Q1.role-layers` 2/3,
`CASE-F.test-mutates-global` 2/3, `CASE-E.nil-return` 2/3. The generic plugin's five
misses on this fixture shrink to three: `R1.Q3.raw-channel-string`,
`R4.Q4.single-noun-package` and `R5.Q5.no-migration-doc` are named in every run now, and
the R4/R5 package-layout gap the generic README pointed at is down to the role-layer
`__init__.py` files in one run. The `CASE-E.nil-return` figure needs a caveat: its grader
matches `catalog.py` anywhere in the report, and run 1 passed it on a docstring DELETE
line; the R2 finding on `parse_device` is in run 3 only. Read as a finding, review-full
named the new plant in one run of three while the scoped case named it in two of two.

## What the generic README's five findings look like under the Python binding

1. **The optional return.** Answered in both scoped runs: R2 Q5 fired on the malformed-line
   `return None` in `parse_device` at `catalog.py:50-51`, the fix named was "Separate
   Failure from Absence (raise for malformed input; keep `None` for the blank line)", and
   `Catalog.find` drew only a docstring DELETE. The whole-repository review is a weaker
   signal: one run of three carried the finding (above).
2. **The `Retention` cluster rendered** in both case A runs (`🔗 CLUSTER: RetentionDays`,
   `🔗 CLUSTER: retention duration`), where the generic plugin rendered it in neither.
   Run 1 lost the `cluster-retention-r2` grader because it filed the `config.py` sentinel
   `0` as R1 Q4 inside the cluster instead of R2; the finding is there, the rule id is
   not. review-full did not render the cluster in any of its three runs; the generic
   plugin rendered it once there (run 1, under #29). One run each way is noise by the
   rule below.
3. **The flag-driven loop was found in both case C runs** (`evidence-flags` 2/2 against the
   generic 1/2). In run 2 the skeptic refuted the R1 extraction with score 0 and the report
   shipped "Extract a private predicate + `next()`-based selection — no new type" as
   Polish, so the `fix-extract-leaf-type` grader had nothing to match. That is the
   skeptic doing its job on a judgment call, graded by a pattern that accepts only the
   move name.
4. **The centerpiece went 12/12 once and 11/12 once.** Run 1 quoted the three section
   comments; run 2 wrote "three block comments (101, 129, 149) name unextracted sections"
   and the R3 Q3 grader wants the comment text. The generic plugin's second miss, a
   `Status` cluster with no R11 id, did not recur: run 2's skeptic refuted the `Status`
   type (score 0) and kept the scoring duplicate as a confirmed R11 finding without a type.
5. **Citations of clean controls** moved from case F to review-full. `_drain()` was not
   cited in either case F run. `Tenant.parse` was cited in all three review-full runs,
   each time as the existing validating constructor the report wants wired in ("zero
   production call sites", run 2), which the `precision-CTRL.R1.tenant-type` grader counts
   as a mention. The owner decision from `go-2.11.0-c78b55f` finding 4 is still pending;
   it is now the same control under two plugins, three runs of three here.

## What one plugin found that the other did not

Python and not generic: both case B move names (`Name enum strings`, `Introduce Parameter
Object`) in one run, which no generic run named on either fixture; the `Retention`
cluster in the scoped case, twice; the flag-driven loop in both case C runs; and the
three review-full recall ids above. The `Reporter` cluster rendered in one review-full
run under each plugin.

Generic and not Python: the `judge-categories` judge, which the generic plugin passed in
all three review-full runs and the Python plugin in one. The judge wants the production
`time.sleep` (R10 Q5, the retry backoff in `process_heartbeat` and `retry.py`) as its own
row under 🔴 Design Debt. Run 1 did not report it at all; run 3 named it inside the
`process_heartbeat` cluster's evidence ("a bare `time.sleep(attempt * 0.2)` blocks the
calling request thread ... no cancellation path (R10 Q5)") and filed `retry.py`'s sleep
under 🐛 Bugs as a missing dispatch case. The finding is present in two runs and absent in
one; the category is what the judge measured. Two runs of three is a signal by the rule
below, on a judge that no baseline had failed before.

Unplanted bugs the Python plugin reported, as the generic one did: the `_flush_loop`
thread leak and the unguarded `last_seen` writes in `device_service.py` (both centerpiece
runs, under 🐛 Bugs), the cache TTL write outside the lock (review-full), the registry's
lazy singleton (both case F runs). New in this run: case F filed `svc/__main__.py`'s
detached scheduler thread as a bug because `Scheduler.run` is a bounded one-shot pass
whose exceptions are lost (run 1), adding that nothing enqueues before the thread starts,
so the run drains nothing and exits (run 2); and the pool workers' loop lets any exception
outside its narrow catch kill the worker thread silently, shrinking the pool with no
caller told (case F run 1).

## Noise floor

This baseline's own runs flip on: case-a 1 (`cluster-retention-r2`), case-b 2
(`fix-name-enum`, `fix-parameter-object`), case-c 1 (`fix-extract-leaf-type`), case-d 0,
case-e 0, case-f 0, the centerpiece 1 (`r3-q3-block-comments`); five graders across the
scoped cases where the generic plugin flipped on thirteen. review-full's three runs differ
on `cluster-reporter`, `cluster-role-packages`, `judge-categories`,
`recall-CASE-E.nil-return`, `recall-CASE-F.test-mutates-global`,
`recall-R5.Q1.role-layers`, and miss `cluster-retention` and
`precision-CTRL.R1.tenant-type` in every run. For the next Python baseline: one grader on
a scoped review is noise, two is a signal; review-full inside 104 to 106 of 110 is noise;
a change on `evidence-dial`, on the two graders review-full misses every run, or on the
`judge-categories` judge is the signal to look for.

## Grader changes made after the run

Verdicts above are as recorded. The grader pass that followed this run (branch
`claude/grader-fixes`) changed six things this baseline had flagged: `evidence-dial`
matches `_dial` with or without parentheses; `recall-CASE-E.nil-return` needs
`parse_device` or a line inside it; `recall-R10.Q5.production-sleep` needs the sleep
with its backoff argument, the fix name, or "bare time.sleep" beside retry/backoff;
the tenant-type and region-zone-switch controls take `precision: finding` (a mention is
a reference, a `file:line` cite in a row naming the control's rule is the finding);
case F's `_drain()` grader draws the same line; review-full's timeout is 3600 s.
Regrade effect on this baseline, measured against a regrade with the graders just
before it: case B 0/2 → 1/2 (run 2); review-full 106 · 106 · 104 → 105 · 107 · 105 of
110: +`precision-CTRL.R1.tenant-type` in every run, and in run 1
−`recall-CASE-E.nil-return` and −`recall-R10.Q5.production-sleep`, the two vacuous
passes the notes below describe. Pass rate 0.72 → 0.76 (22 of 29). The two regrades
also showed `judge-categories` flipping on run 2's trace, FAIL once and PASS once
against the recorded PASS, so finding "Generic and not Python" above reads as one to
two runs of three, not a firm two.

A separate fixture PR (branch `claude/harden-parse-controls`) closes the gap run 2
found in the control itself: `Tenant`, `Window` and `DeviceID` validate on
construction, so `Tenant(_id="INVALID!!!")` raises and the docstrings are true.
`Region` is a `StrEnum` and already did.

## Grader notes for a follow-up

Recorded at the time of the run; the first three and the timeout landed in the grader
pass above:

- `evidence-dial` (case B) matches only `_dial(`; both reports named `_dial` in backticks
  without the call parentheses. The finding it guards was present in both runs.
- `recall-CASE-E.nil-return` in review-full matches `catalog\.py` anywhere in the report.
  Run 1 passed it on a docstring DELETE line that cites `catalog.py:10,20-21,27-28`; the
  R2 finding on `parse_device` was not in that report.
- `recall-R10.Q5.production-sleep` matches any of three filenames, which every report
  cites dozens of times. In run 1 the `judge-categories` judge established that the
  production `time.sleep` was not reported at all while the recall grader passed.
- review-full's `timeout_seconds: 2400` is tight: the finished runs took 29, 33 and 34
  minutes here and 30 to 38 minutes under the generic plugin, and one run was lost to it.

## Infrastructure notes

- Same container recipe as the generic baseline: `uv tool install --force mypy --with
  pytest` before the run so the pristine fixture type-checks clean; `zstd` and `rsync`
  installed with apt; `task` built with `go install` (the container has Go 1.24 and no
  `task`); tool caches removed from the fixture after the pre-run `task lint` and
  `task test` (ruff clean, mypy clean, 96 tests).
- `scripts/set-cmd-prefix.sh` wrote `py-ldd` into 22 files; no `{{cmd_prefix}}` token
  remained outside the fixture.
- **review-full run 3 timed out in the first pass.** The runner killed the agent at
  2400 s with `claude timed out: context deadline exceeded`; the last agent message was
  six minutes earlier, so a subagent was mid-flight. The runner recorded the run as
  failed at $0 and 0 turns and went on to the trigger cases (first-pass aggregate: 0.72
  over 29 runs, $60.46). The timed-out run directory was moved out of the run before the
  resume, so it is not in `cheap/` or in `traces.tar.zst`; the resume with `RESUME=1`
  reused the other 28 results and executed review-full run 3 once more (49 turns, 29
  minutes, $10.31). The cap was raised to 75 for the resume because the runner's ledger
  counts resumed runs against the budget and the recorded total was heading past 70; the
  cap never tripped in either pass.
- The run executed from the web container with the `claude` CLI authenticated by the
  session, a `Monitor` on the log re-armed every 30 minutes and an hourly check-in.
  Nothing was regenerated in the measured plugin directory during either pass; the
  resume's `py:cases` re-copy happened between the passes, when no run was reading it.
- `run.log` was kept out of the promoted directory.
