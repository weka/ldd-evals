# The TypeScript + React suite

ts-react-mini is go-mini and py-mini seen from the React frontend that talks to
the fleet API: a Vite + React 18 + TypeScript `strict` dashboard with the same
pages the service has endpoints (Devices, DeviceView, Heartbeats, Settings,
Status), the same 156 planted violations and controls under
`ts-react/violations.yaml` with TypeScript anchors, plus a block of 8 React-only
ids appended (164 entries), and the same 23 cases as the Python suite under `cases/`, with
TypeScript paths in the prompts and the graders' regexes re-spelled for the
language. The plugin under test is `ts-react-linter-driven-development`
(command prefix `tsr-ldd`). The design brief that fixed the file paths every
prompt and grader names is the contract; the fixture's own README describes the
application.

## Layout

    Taskfile.yaml          cases · manifest · graders · run · regrade · baseline (PLUGIN, TIER, CAP, OUT, CASE, RESUME, CMD_PREFIX)
    fixture/ts-react-mini/ the fixture: npm, Vitest + happy-dom + Testing Library + MSW, ESLint 9 flat config with SonarJS
    violations.yaml        the answer key: every plant and control, anchored by file + regex
    check-manifest.sh      anchors match, no hint words, every rule has plants and controls
    scaffold/default.sh    copy → git init → one commit → npm ci from the shared cache under $TMPDIR/ts-react-mini-npm-cache
    scaffold/red-lint.sh   the same with every eslint-disable / @ts-expect-error / @ts-ignore stripped (ESLint and tsc red on the plants)
    postcheck/lib.sh       py's helper names on the TypeScript tools (see below)
    postcheck/complexity-of.mjs       one function's number out of an ESLint JSON report
    postcheck/eslint.orig.config.js   the fixture's ESLint config as shipped; `task ts-react:manifest` checks it has not drifted
    postcheck/assertion-counts.txt    assertion lines per fixture test file; postcheck/gen-assertion-counts.sh regenerates or checks it
    postcheck/heartbeat-blackbox/     blackbox.test.tsx + expected.tsv (byte-identical to py's recording): the hidden top rung
    cases/                 the 23 cases, suite.yaml (`*.ts*` minus `*.test.ts*`), the 8 neutral variants and NEUTRAL.md

## Two lint states

`scaffold/default.sh` copies the tree as it is: `task lint` (`tsc -b`, `eslint .`,
`prettier --check .`) is green because every design-level plant carries a
suppression, and a review must flag every directive. `scaffold/red-lint.sh`
strips them first — whole-line `// eslint-disable-next-line …`,
`/* eslint-disable … */`, `// @ts-expect-error …` and `// @ts-ignore …`,
trailing `// eslint-disable-line …` tails, and the god file's configuration
comment `/* eslint sonarjs/max-lines: "off" -- TODO */` (sonarjs/max-lines
reports at line 0, before any disable directive, so that comment is the only
in-file silence that works) — and commits that state, so a quickfix run's diff
is only the agent's work. In the red state ESLint reports **62** findings
across **21** rules and tsc **3** errors; these are the numbers the quickfix
case exercises and `cases/quickfix-red-lint/case.yaml` describes (45 of the 62
fall inside that case's scope). By rule id:

| Findings | Rule |
|---|---|
| 28 | `no-magic-numbers` |
| 6 | `promise/prefer-await-to-then` |
| 4 | `sonarjs/nested-control-flow` |
| 3 | `max-params` |
| 2 each | `@typescript-eslint/no-explicit-any`, `@typescript-eslint/no-floating-promises`, `sonarjs/cognitive-complexity`, `sonarjs/cyclomatic-complexity` |
| 1 each | `import/no-mutable-exports`, `no-else-return`, `react-hooks/exhaustive-deps`, `react-hooks/refs`, `react/no-multi-comp`, `react/no-unstable-nested-components`, `sonarjs/elseif-without-else`, `sonarjs/max-lines`, `sonarjs/no-identical-functions`, `sonarjs/no-misleading-array-reverse`, `sonarjs/no-redundant-assignments`, `sonarjs/prefer-read-only-props`, `sonarjs/redundant-type-aliases` |

The three tsc errors are the `@ts-expect-error` plants: the `UseQueryResult`
literal `vi.mock` hands `useDevices` in `pages/Devices/DevicesPage.test.tsx`
and the two `possibly 'undefined'` reads of the picker's tuple in
`pages/Devices/placement/picker.test.ts`. `heartbeatFeed.ts` alone carries 29
of the 62 findings.

## The centerpiece

`processHeartbeat` in `src/pages/Heartbeats/heartbeatFeed.ts` applies the same
transition rules as the Go and Python handlers behind the heartbeat simulator
page, as one function at SonarJS cognitive complexity **85** (SonarJS
cyclomatic complexity **43**; the core `complexity` rule, which
`postcheck/lib.sh`'s `gocyclo_of` reads, counts 47) in a 798-line file,
measured with
`eslint --no-inline-config --rule '{"sonarjs/cognitive-complexity":["error",0]}'`
the way `postcheck/lib.sh`'s `gocognit_of` measures it. The hidden black-box
suite renders the app at `/heartbeats`, drives the simulator with the 41
recorded lines of `postcheck/heartbeat-blackbox/expected.tsv` (tenant, force,
body, status, response), compares the Result region's text with the expected
response byte for byte and the Status code, and counts six alert POSTs through
an MSW handler that answers 500 to the first two. `run_blackbox` copies the
test into `src/__blackbox__/`, runs `vitest run src/__blackbox__`, and deletes
the directory, so the agent never sees it.

## Size

167 `.ts`/`.tsx` files under `src/` (107 modules and 60 colocated test files,
176 tests) and 25 `.module.scss` files, 7,077 lines of TypeScript and TSX
(4,982 outside the tests and `src/test-utils/`), 1.3 MB without
`node_modules`. py-mini is 90 files and 3,800 lines; the overshoot is the
tests (every component carries one) and the five pages. The manifest holds 164
entries: the 156 ids shared with go-mini and py-mini, in the same order, plus 8
React-only plants (`R3.react.unstable-nested-component` …
`R2.react.nullable-prop`).

## postcheck/lib.sh

The same helper names as the Go and Python suites, on the TypeScript tools:

| Helper | What it runs |
|---|---|
| `run_task <name>` | `task <name>` in the scaffold (build · test · lint) |
| `gocognit_of <fn> [path]` | ESLint with `sonarjs/cognitive-complexity` at threshold 0 and `--no-inline-config`; `complexity-of.mjs` attributes the message to the named function |
| `gocyclo_of <fn> [path]` | the same with the core `complexity` rule at 0 |
| `count_matches`, `count_matches_prod`, `count_matches_at`, `count_suppressions` | greps over the tree or a revision; "production" is `src/**/*.ts(x)` minus `*.test.*`, `test-utils/`, `node_modules/` |
| `func_body`, `callees_in`, `new_type_names`, `external_test_calls` | the body of a function by brace depth; the helpers it calls; exported types absent at the base commit; test lines in files that `vi.mock` no sibling |
| `base_commit`, `commits_since_base`, `ratchet_nonincreasing`, `pkgs_touched_per_commit` | the git-history ratchets (a directory is the package) |
| `run_blackbox` | the hidden suite above |
| `lint_issue_count`, `count_assertions`, `assert_assertions_kept`, `assert_lint_config_unchanged`, `file_unchanged_since_base`, `last_message_contains` | the workflow cases' end-state checks |

## Running it

    task ts-react:manifest                       # violations.yaml against the fixture, the lint-config copy, the assertion counts
    task ts-react:graders                        # regenerate review-full's recall/cluster/precision graders and the neutral copies
    task ts-react:run TIER=cheap CAP=1 CASE='trigger-*' PLUGIN=/path/to/ts-react-linter-driven-development
    task ts-react:run TIER=cheap CAP=60 OUT=results/ts-react-<date>
    task ts-react:run TIER=medium CAP=80 OUT=results/ts-react-<date>
    task ts-react:regrade OUT=results/ts-react-<date> TIER=cheap
    task ts-react:baseline OUT=results/ts-react-<date>   # → baselines/ts-react-<version>-<sha>/

The scaffold and the postchecks need `node` 22, `npm` and `jq` on PATH beside
`task`; the first scaffold of a run fills the npm cache from the network, every
later one installs from it in seconds. The eight `*-neutral` cases are the
old-vs-new A/B against the hand-written 1.x plugin, run with `TIER=neutral`;
`cases/NEUTRAL.md` explains what they keep and what they drop.

## Baselines

- [`baselines/ts-react-2.1.0-4077431/`](../baselines/ts-react-2.1.0-4077431/README.md)
  — the 2.1.0 plugin over ts-react-mini, cheap tier, 39 runs: pass rate 0.74; case A
  and case D pass 2/2; `review-full` passes 116 to 120 of 128 graders, with a
  coverage loss its README names three suspects for.
- [`baselines/ts-react-2.0.0-b64f8a8/`](../baselines/ts-react-2.0.0-b64f8a8/README.md)
  — the generated 2.0.0 plugin over ts-react-mini, cheap tier, 37 runs: pass rate
  0.78, whole-repository recall 263 of 270 with every control held, read against the
  neutral A/B with the hand-written 1.2.0 plugin. Its README carries the per-rule
  recall report, the cluster-header and coverage notes, and the weaknesses to take to
  core and to the fixture.
