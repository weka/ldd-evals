# Baseline ts-react-2.1.0-4077431 — the TypeScript + React plugin over ts-react-mini, cheap tier

Plugin `ts-react-linter-driven-development` (command prefix `tsr-ldd`) from
`buzzdan/ai-coding-rules` at **2.1.0**, main at `4077431` (#102, the release of the
fixes measured here). The suite is this repository's main after #44, #46 and #47,
plus the fixture and grader changes of the pull request that adds this baseline.
Agent model pinned to `claude-sonnet-5`, judge `claude-haiku-4-5` voting 2 of 3, run
2026-10-18 to 2026-10-19 on macOS, Claude Code CLI 2.1.302; every run has
`segments: 1`.

    bin/ldd-eval run --tag cheap --model claude-sonnet-5 --max-cost-usd 95 --keep-temp \
      --plugin-dir <checkout at 4077431>/ts-react-linter-driven-development \
      --out results/ts-react/cheap <checkout>/ts-react-linter-driven-development/evals
    task ts-react:baseline OUT=results/ts-react PLUGIN=<checkout>/ts-react-linter-driven-development

Recorded spend (agent plus judge): **$89.86** over 39 runs. The first run of the tier
cost $90.75. Case D and its neutral twin ran again after the fixture fix below, and
their new runs replace the old ones.

The trace archive `traces.tar.zst` is not in this repo. Copy it from the same path
in the internal `weka/ldd-evals-traces` repo, which only WEKA members can open, then unpack it beside the verdicts before regrading:

    cd baselines/ts-react-2.1.0-4077431 && zstd -dc traces.tar.zst | tar -xf - -C .

## What changed since ts-react-2.0.0-b64f8a8

The plugin:

- The cluster title carries its rule ids.
- An absence claim carries its listing.
- R5 Q2 lists the longest files against `sonarjs/max-lines`.
- On `--all`, the mutant question (R7 Q7) is per-leaf and not judged.
- The R7 Q7 hand check reads the error assertions.
- The review command says how to cover a large repository.

The plugin main also carries the multi-language dispatch (#86), so this run is not a
one-change comparison.

The suite, all before this run was graded:

- **Fixture, the case D control.** `withTrace` and `traceFromSearch` have production
  callers (`DevicesPage` → `useDevices` → `fetchDevices`). The `withTrace` comment has
  3 prose lines and states that an empty id adds no header. The `traceFromSearch`
  comment states that it returns `''` for a URL with no `trace` parameter. Red lint,
  tsc and the 176 tests do not change.
- **Case G**, a scoped review of the three leaves that hold the R7 Q7 plants.
- **`recall_own`** gives the god file its own grader. The report must name
  `heartbeatFeed.ts` with its size, its lint limit or "god file".
- **`scoped_review`** marks the three R7 Q7 plants as scoped-only. The review-full
  graders leave them out, and case G judges them. `recall-R7.Q7.*` leave
  `review-full`. `q7-routed-per-leaf` replaces them and passes when the report routes
  Q7 as per-leaf. A side effect: `recall-R4.Q4.single-noun-package` now matches
  `deviceId.ts` only, not its test file.
- **`cluster-alert-channel`** also accepts `Alert` as the anchor. `Alert`,
  `Alert.channel` and `channel` name the same missing concept.
- **`no-absent-test-claim`** in case C.

## Pass rates

| Case | Passed | Turns | Cost | Was (2.0.0) |
|---|---|---|---|---|
| trigger-ts-react | 3/3 | 6,4,4 | $0.49 | 3/3 |
| trigger-non-ts-react | 3/3 | 1,1,1 | $0.18 | 3/3 |
| review-clean-tree | 3/3 | 2,3,2 | $0.35 | 3/3 |
| quickfix-clean-tree | 3/3 | 2,3,3 | $0.37 | 3/3 |
| case-a-retention-review | 2/2 | 23,16 | $4.58 | 0/2 |
| case-b-endpoint-review | 1/2 | 17,17 | $4.65 | 2/2 |
| case-c-picker-review | 2/2 | 13,15 | $4.24 | 2/2 |
| case-d-ceremony-review | 2/2 | 13,12 | $3.42 | 1/2 |
| case-e-nils-review | 1/2 | 14,19 | $4.96 | 1/2 |
| case-f-globals-review | 1/2 | 14,14 | $5.09 | 2/2 |
| case-g-leaf-mutants-review | 1/2 | 18,20 | $5.26 | – |
| centerpiece-storify-review | 1/2 | 15,21 | $8.49 | 2/2 |
| review-full | 0/3 | 29,38,26 | $23.06 | 0/3 |
| the 8 neutral cases | 6/8 | | $23.93 | 7/8 |

Tier pass rate 0.74 (2.0.0: 0.78 over 37 runs).

**review-full, read on its grader count:** 116, 120 and 120 of 128 (2.0.0: 124, 122
and 123 of 128, with a different grader set).

**A regrade with the current graders** counts two more graders in review-full:
`recall-R5.Q7.models-file-count` and `recall-R5.Q7.services-file-count`. They need the
package-size row that the detection pass writes for R5 question 7. This plugin does not
write it, so they fail by design: read them as new capability, not as a regression.

## Reading the deltas

| Grader | 2.0.0 fails | 2.1.0 fails | Cause | Evidence |
|---|---|---|---|---|
| case A `cluster-retention-r1`, `-r2` | 2/2 | 0/2 | fixed | the cluster title carries the rule ids |
| case D `precision-trace-func-clean` | 1/2 | 0/2 | fixed | the control has callers, and its comments state their contracts |
| case D neutral `precision-trace-func-clean` | 0/1 | 1/1 | noise | one run: a critic TRIM of the one-line `traceFromSearch` comment |
| `review-full` `recall-R5.Q1.god-file` | – | 2/3 | new grader | first measurement, 1/3 |
| `review-full` `q7-routed-per-leaf` | – | 0/3 | new grader | every report routes Q7 as per-leaf. Some reports give it the label of another question. |
| `review-full` `recall-R1.Q1.handler-inline-checks`, `recall-R12.Q4.setter`, `recall-CASE-E.nil-return`, `recall-R4.Q4.single-noun-package` | 0–1 | 1–2 | coverage | each failing run names the plant's directory in a `not reached:` line |
| `review-full` `cluster-retention` | 1/3 | 3/3 | unknown | no report clusters the retention anchor |
| `review-full` `cluster-alert-channel` | 0/3 | 2/3 | unknown | the reports cluster `Notifier`, or leave the channel findings unclustered |
| case B, case F, centerpiece, case G | – | one run each | noise | one flipped grader in one run. Case G's flip is `recall-q7-tenant-message`, the grader its fix targets. |

The coverage loss on `review-full` has three suspects that this run cannot separate:

- the macOS host (2.0.0 ran on Linux)
- the multi-language dispatch
- the hunter budget that the listing and `wc -l` steps use
