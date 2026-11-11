# Baseline generic-pymini-0.1.0-5890313 — the generic plugin over py-mini, cheap tier

Plugin `linter-driven-development` (the generic binding, command prefix `ldd`) from
`buzzdan/ai-coding-rules` at **0.1.0**, main at `5890313` (the merge of #43, the eval
docs). The rendered plugin is byte-identical to the one `generic-gomini-0.1.0-109b0db`
measured: the two commits between the pins touched only `docs/`. The Python suite as of
this repository's `3dde994` (after #26, the prefix token, and #27). Agent model pinned to
`claude-sonnet-5`, judge `claude-haiku-4-5` voting 2 of 3, run 2026-09-18 from a Claude
Code on the web container (Linux), **Claude Code CLI 2.1.276**; every run has `segments: 1`.

This is the Python suite's first baseline and the floor for the Python binding: the same
core rendered without Python knowledge, measured on the Python fixture. The question it
answers is what the generic plugin sees in Python that it also sees in Go, rule by rule;
the Python binding's own first baseline is read against it.

    task py:run TIER=cheap CAP=70 OUT=results/generic-py-floor MODEL=claude-sonnet-5 PLUGIN=../ai-coding-rules/linter-driven-development
    BASELINE_NAME=generic-pymini-0.1.0-5890313 scripts/promote-baseline.sh results/generic-py-floor ../ai-coding-rules/linter-driven-development python

Cheap tier only, one invocation, the cap never tripped. Spend (agent plus judge):
**$62.42** over 29 runs, judges $0.28. The same plugin's go-mini floor cost $64.86.

**Verdicts are as recorded, not regraded.** Three grader fixes landed after this run and
before promotion (#28, #29, #30, "Grader changes" below); the owner chose to keep the
recorded verdicts. The tables say per case what a regrade would change. The trace archive `traces.tar.zst` is not in this repo. Copy it from the same path
in the internal `weka/ldd-evals-traces` repo, which only WEKA members can open, then unpack it beside the verdicts before regrading:

    cd baselines/generic-pymini-0.1.0-5890313 && zstd -dc traces.tar.zst | tar -xf - -C .

## Pass rates

Cheap tier (`cheap/`), runs passing every grader, verdicts as recorded:

| Case | Passed | Turns | Cost | Reads as |
|---|---|---|---|---|
| trigger-py | 3/3 | 5,3,4 | $0.30 | announced, skill invoked, pre-flight listed `task test` and `task lint` (ruff, mypy), DONE |
| trigger-non-py | 3/3 | 1,1,1 | $0.12 | control under the two-sentence prompt; not a trigger measurement for this plugin |
| case-a-retention-review | 0/2 | 27,39 | $3.21 | 10/13 then 11/13: no `Retention` cluster in either run; run 1 also lost the skeptic's score line |
| case-b-endpoint-review | 0/2 | 28,37 | $3.56 | 13/15 then 11/15; `fix-name-enum` and `fix-parameter-object` miss both runs |
| case-c-picker-review | 1/2 | 32,22 | $3.46 | 8/10 then 10/10: run 1 saw no flag-driven loop and the skeptic refuted the extraction |
| case-d-ceremony-review | 1/2 | 26,40 | $2.16 | 11/12 then 12/12: run 1 wrote "drop dead ceremony wrappers", which the grader did not accept until #30; the control held in both runs |
| case-e-nils-review | 0/2 | 36,21 | $2.84 | 13/14 then 11/14: the `Device \| None` return was never flagged |
| case-f-globals-review | 1/2 | 40,45 | $5.26 | 14/14 then 13/14: run 2 cited the clean `_drain()` control inside an unplanted-bug finding |
| centerpiece-storify-review | 0/2 | 38,49 | $11.10 | 11/12 both runs, one different grader each: the section comments not quoted, then the `Status` cluster without an R11 id |
| review-clean-tree | 3/3 | 6,3,7 | $0.30 | scope control: "nothing to review", `--all` named, no agent |
| quickfix-clean-tree | 0/3 | 3,3,2 | $0.20 | every transcript grader passed; the postcheck failed to find `lib.sh` (#28) |
| review-full | 0/3 | 62,51,54 | $29.63 | **106, 104, 103 of 111**; the report was the final message in all three runs |

**A regrade with the current graders** counts one more grader in review-full:
`recall-R5.Q7.models-file-count`. It needs the package-size row that the detection pass
writes for R5 question 7. This plugin does not write it, so the grader fails by design:
read it as new capability, not as a regression.

The private-leaf graders add two more graders to review-full:
`recall-R7.Q4.private-leaf-in-io` and the control `precision-CTRL.R4.trivial-private-in-io`.
The recall grader needs the placement rules for a private leaf in an I/O module. This
plugin does not have them, so the recall grader fails by design. The control passes.
The three new cases have no trace here, so a regrade does not grade them:
`case-h-private-leaf-review` (6 graders), `design-private-leaf` (4) and
`promote-private-leaf` (6).

Pass rate 0.41 (12 of 29 runs), average grader score 0.92. A regrade with the three fixes
gives quickfix-clean-tree 3/3, case D 2/2 and review-full run 1 at 107: pass rate 0.55.

## Comparison with generic-gomini-0.1.0-109b0db

Same plugin, same model pin, the other fixture. Runs passing all graders, then the grader
level; the go-mini column is that baseline's recorded verdict.

| Case | go-mini | py-mini | Grader level | Reads as |
|---|---|---|---|---|
| trigger-* | 3/3 · 3/3 | 3/3 · 3/3 | identical | the generic skill triggers on both languages under the invoking prompt |
| case-a | 1/2 | 0/2 | 11/13 · 13/13 → 10/13 · 11/13 | the retention cluster rendered in one go-mini run and in no py-mini run |
| case-b | 0/2 | 0/2 | 12/15 · 12/15 → 13/15 · 11/15 | the same two move names missing; skeptic lines flip |
| case-c | 2/2 | 1/2 | 10/10 · 10/10 → 8/10 · 10/10 | one run missed the flag loop entirely (finding 3) |
| case-d | 2/2 | 1/2 | 12/12 · 12/12 → 11/12 · 12/12 | grader wording; 2/2 under #30 |
| case-e | 1/2 | 0/2 | 14/14 · 13/14 → 13/14 · 11/14 | `fix-comma-ok` misses both runs here, one run there (finding 1) |
| case-f | 1/2 | 1/2 | 14/14 · 13/14 → 14/14 · 13/14 | the same `_drain()` citation, once each |
| centerpiece | 2/2 | 0/2 | 12/12 · 12/12 → 11/12 · 11/12 | one grader per run, different each time |
| review-clean-tree | 3/3 | 3/3 | identical | |
| quickfix-clean-tree | 3/3 | 0/3 | 6/6 ×3 → 5/6 ×3 | the postcheck path bug; 3/3 under #28 |
| review-full | 108 · 104 · 106 | 106 · 104 · 103 | inside the reference's 100–108 band | `cluster-catalog-find` and `cluster-reporter` miss every run on both fixtures |

The scoped reviews lost one grader per run on Python in most cases, which the go-mini
noise floor calls noise case by case and a signal in aggregate: the same direction eight
times out of eleven. review-full stayed inside the band. Cost: py-mini $62.42 against
go-mini $64.86, with review-full at $29.63 against $30.81 and the centerpiece at $11.10
against $8.99.

## The parity report

Recall per rule over the review-full recall graders (74 per run, three runs), the same
149 manifest ids on both fixtures, the same plugin:

| Rule | py-mini | go-mini |
|---|---|---|
| R1 | 32/33 | 33/33 |
| R2 | 12/12 | 12/12 |
| R3 | 9/9 | 9/9 |
| R4 | 14/15 | 15/15 |
| R5 | 12/15 | 15/15 |
| R6 | 18/18 | 17/18 |
| R7 | 12/12 | 12/12 |
| R8 | 15/15 | 15/15 |
| R9 | 24/24 | 24/24 |
| R10 | 6/6 | 6/6 |
| R11 | 18/18 | 18/18 |
| R12 | 9/9 | 9/9 |
| case plants | 34/36 | 36/36 |
| **total** | **215/222 (0.968)** | **221/222 (0.995)** |

The ids missed on py-mini, with the runs that named them: `R5.Q1.role-layers` 1/3,
`CASE-F.test-mutates-global` 1/3, `R1.Q3.raw-channel-string` 2/3,
`R4.Q4.single-noun-package` 2/3, `R5.Q5.no-migration-doc` 2/3. On go-mini the one miss
was `R6.Q1.device-repository` 2/3, which py-mini named in every run. The gap is in R5 and
R4, the package-layout rules: the role-layer `__init__.py` files, the single-noun package
and the snapshot README are named in fewer runs on Python. Every other rule's recall is
equal on the two fixtures. The scoped cases add what the whole-repository recall does not
measure: the R2 optional-return shape (finding 1) and the cluster rendering (finding 2).

## Findings about the generic plugin on Python

1. **`X | None` for absence is not read as R2's nil return.** Case E's `Catalog.find`
   returns `Device | None`; neither run flagged it, and run 1 wrote that the type "already
   conveys not-found". Run 2 also let `Reporter(sink, None, None)` in the wiring pass
   without a nil-arguments finding while quoting the line. On go-mini the same question
   fires on `(*Device, error)`. The generic R2 payload's pseudocode does not name the
   optional type as the shape, so the model applies the language's idiom. Whether an
   optional return for absence is a finding in Python at all is the first position the
   Python binding must take; the fixture's answer key says it is (`CASE-E.nil-return`).
2. **The `Retention` cluster never renders on py-mini.** Both case A runs carry the R1 and
   R2 findings on `policy.py` and `config.py` and no `🔗 CLUSTER` entry for them; go-mini
   rendered it in one run of two. review-full run 1 did render it, so the convergence is
   possible; the scoped review's shorter context is where it is lost.
3. **The flag-driven loop can go unseen.** Case C run 1 has no R3 finding on
   `primary_found`/`secondary_found`, and the skeptic refuted all three R1 extractions,
   arguing that empty zone and zero capacity are deliberately tested states. Run 2 found the
   loop and named Extract Leaf Type. On go-mini both runs found it. A one-run miss, but on
   the case that was 2/2 for both plugins on Go.
4. **The centerpiece loses one different grader per run.** Run 1 proposed the storify move
   without quoting the three section comments as evidence; run 2 rendered a `Status`
   cluster whose R11 hunter had cleared the status switches as R1's territory. Both are
   judgment calls the Go rendering did not make.
5. **Citations of clean controls count as mentions**, as in every baseline so far: `_drain()`
   inside a scheduler bug (case F), `Tenant.parse` and `Region.zone()` as the fix route the
   report recommends (review-full). The owner decision from `go-2.11.0-c78b55f` finding 4 is
   still pending, and it is now three controls on two fixtures.

Unplanted bugs the plugin found on py-mini as it did on go-mini: the flush-loop thread
leak, the unguarded `last_seen` writes and the cache TTL race in `device_service.py`, the
registry's singleton store; plus one new to Python: the scheduler thread drains its queue
once at boot and sends its shutdown sentinels before any request can enqueue.

## Noise floor

This baseline's own runs flip on: case-a 1 (`skeptic-confirmed-4plus`), case-b 4
(`fix-parameter-object`, `precision-test-clean`, then `skeptic-confirmed`,
`skeptic-travels-together`), case-c 2 (`evidence-flags`, `fix-extract-leaf-type`), case-d 1
(the wording), case-e 2 (`r2-q5-nil-return`, `r2-q6-nil-args`), case-f 1, the centerpiece 2
(one each way); review-full's three runs differ on `cluster-job-kind`,
`cluster-role-packages`, `precision-CTRL.R1.tenant-type`,
`precision-CTRL.R11.region-zone-switch`, `recall-CASE-F.test-mutates-global`,
`recall-R1.Q3.raw-channel-string`, `recall-R4.Q4.single-noun-package`,
`recall-R5.Q1.role-layers`, `recall-R5.Q5.no-migration-doc`. Wider than go-mini's floor
under the same plugin. For the Python binding's comparison: one grader on a scoped review
is noise, two is a signal; review-full inside 103–107 is noise; a change on the two
graders that missed in both runs (`fix-comma-ok`, the retention cluster) is the signal the
binding is meant to produce.

## Grader changes made after the run

- #28: the eleven Python postchecks find `postcheck/lib.sh` from the copied layout. Regrade
  effect: quickfix-clean-tree 0/3 → 3/3.
- #29: the generated cluster graders match the anchor without regard to case (both
  suites). Regrade effect: review-full run 1 106 → 107; no go-mini verdict moves.
- #30: case D's `cheaper-alternative-int` accepts "dead" among the qualifiers (both suites).
  Regrade effect: case D 1/2 → 2/2.
- The grader pass after `python-0.2.0-6ef1dcd`: `precision: finding` on the tenant-type
  and region-zone-switch controls (a mention is a reference, a `file:line` cite in a
  row naming the control's rule is the finding), the same line for case F's
  `_drain()` grader, `evidence-dial` without the call parentheses, recall anchors for
  `CASE-E.nil-return` and `R10.Q5.production-sleep` that need the plant named rather
  than its file, and the review-full timeout at 3600 s. Regrade effect on this
  baseline, measured against a regrade with the graders just before it so the earlier
  fixes do not blur it: case F 1/2 → 2/2 (`precision-drain-clean`, run 2); review-full
  +`precision-CTRL.R1.tenant-type` in run 1, +`precision-CTRL.R11.region-zone-switch`
  in run 2, and −`recall-CASE-E.nil-return` in all three runs, which is not three
  misses: this fixture predates the `parse_device` plant (#32), so the anchor the
  grader now needs was not there to name, and the old pattern passed on docstring
  citations of `catalog.py`. Level under all fixes: 107 · 104 · 102 of 110. Pass rate
  0.55 → 0.59 (17 of 29).

## Infrastructure notes

- `mypy` in the web container is a `uv` tool whose environment had no `pytest`, so the
  pristine fixture reported 24 false type errors on its test files. `uv tool install
  --force mypy --with pytest` before the run; `task lint` is then green on the untouched
  tree, which every review case relies on.
- Running the fixture's own checks in the source tree leaves `__pycache__` and tool caches
  that `rsync` would copy into every scaffold. Delete them before a run.
- The run executed in one sitting from the web container with the `claude` CLI
  authenticated by the session, a `Monitor` on the log re-armed every 30 minutes and an
  hourly check-in. Nothing was regenerated in the measured plugin directory during the run.
