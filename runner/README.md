# ldd-eval — behavioral eval runner for the linter-driven-development plugins

Stop-gap runner for the suites under `<lang>/cases/` while `claude plugin eval` is gated for this org.
Cases use plugin-eval's exact file format (`prompt.md` frontmatter + body, `graders/*.md`);
only `case.yaml` (`scaffold_script`, `postcheck`, `tier`, `env`, `src_glob`, `test_glob`) and the optional suite-level `suite.yaml` are ours. **When the gate opens, delete
`runner/` and keep the cases** — nothing in them depends on this module. The runner is
language-neutral: a suite is any directory whose children are case directories.

## Usage

    task build                                   # from the repository root: bin/ldd-eval
    ldd-eval run --plugin-dir p [--case glob] [--tag t] [--runs N] [--model m] [--judge-model m] \
                 [--keep-temp] [--resume] [--out dir] [--max-cost-usd x] [--threshold r] <evals-dir>
Every run spends real money. Smoke first:
`ldd-eval run --plugin-dir <plugin> --case 'trigger-*' --runs 1 --max-cost-usd 1 <evals-dir>`.
`task go:run` in this repository wraps the command with the model pinned and the cap set.

| Flag | Default | Meaning |
|---|---|---|
| `--case` | all | `path.Match` glob over case names |
| `--tag` | all | keep only cases carrying the tag (`cheap`, `medium`, `expensive`, ...) |
| `--runs` | case `runs` (3) | runs per case |
| `--model` | case `model`, else `claude-sonnet-5` | agent model; always pinned on the command line |
| `--judge-model` | `claude-haiku-4-5` | model for `llm` graders |
| `--plugin-dir` | required for `run` | plugin root passed to `claude --plugin-dir`; a run always names the plugin it measures |
| `--keep-temp` | off | keep scaffold dirs; path recorded as `scaffold_dir` in result.json |
| `--resume` | off | with `--out`, reuse every run that already has a `result.json` and execute only the rest; a killed tier continues where it stopped, and reused cost still counts against `--max-cost-usd` |
| `--out` | `<evals-dir>/results/<timestamp>` | output directory |
| `--max-cost-usd` | unlimited | abort with exit 2 once agent + judge cost exceeds this |
| `--threshold` | 1.0 | per-case pass rate required for exit 0 |

Outputs: `<out>/<case>/run-<i>/{trace.jsonl,stderr.txt,scaffold.txt,result.json,postcheck.txt,judge-<grader>.txt}`
and `<out>/aggregate-result.json` (`schemaVersion "1"`, `suite`, `cases[]`, `aggregates{passRate, averageScore, totalCostUSD}`).
Exit codes: 0 every case ≥ threshold · 1 some case below · 2 budget exceeded (aggregate still written) · 3 usage/infrastructure.

## Semantics worth knowing

- `regex` with `target: files` counts matching **lines** across the scaffold tree (`.git` skipped); `last_message`/`trace` count matches.
- `last_message` is the agent's final text. When the agent scheduled its own wakeups, headless claude runs several segments and emits one result event each; `last_message` is then every segment's final text joined in order (the report may land in any segment), `num_turns`/`duration_ms` are summed, and `segments` in result.json records how many there were (1 = no wakeups).
- `tool_used`: `input_match` is a regex over the compact JSON tool input; `min: 0 max: 0` means "must not call".
- `tool_order`: the first `before` call must precede the first `after` call, and both must occur.
- `llm` judge votes **2-of-3** like plugin-eval: `claude -p --model <judge> --tools ""` calls whose replies must end with
  `VERDICT: PASS|FAIL`, stopping once two agree (a unanimous verdict costs two calls, a split one three). The grader's
  detail carries the tally (`judge claude-haiku-4-5 (PASS,FAIL,PASS): …`), `judge-<grader>.txt` holds every vote, and
  the summed cost is `judge_cost_usd` in result.json and counts against `--max-cost-usd`. Baselines up to
  go-2.10.0-5828c34 were graded by a single vote.
  `focus` names what the judge reads: `last_message` (default), `{source: file, path: <rel>}`, or
  `{source: files, paths: [<rel>, …]}` which renders each file under a `### <path>` heading so one judge can
  check that concepts landed in the right file (the `art-judge` graders of the refactor cases use it). A path
  that is a directory stands for its non-test source files, chosen by the suite's source and test globs
  (`path.Match` patterns over the file's base name): `<evals-dir>/suite.yaml` sets `src_glob` and `test_glob`
  for every case, a case's `case.yaml` may override either, and the default is Go's (`*.go` minus `*_test.go`),
  so a suite that names nothing grades exactly as before.
- `is_error` results get a failing synthetic `execution` grader; timeouts/incomplete traces set `error` and skip grading.
  The agent runs with `IS_SANDBOX=1` because `--permission-mode bypassPermissions` is refused for root without it
  (harmless for other users), and without `CLAUDE_AUTO_BACKGROUND_TASKS`: cloud sessions export that flag, and
  under it claude turns any foreground `Agent` call still running after 120 seconds into a background task
  answered "Async agent launched", which a developer's shell never does. A case's `case.yaml` `env:` map
  adds its variables to the agent's environment, after the runner's own, so a case value wins over the runner's,
  except that a case cannot set `CLAUDE_AUTO_BACKGROUND_TASKS` or override `IS_SANDBOX=1`. The postcheck does
  not get the map. Runs recorded before this was stripped
  (every baseline up to go-2.10.0-5828c34) carry that host behavior in their `segments` and polling counts.

## Regrading without re-running

`ldd-eval regrade --out <previous-run-dir> [--case glob] [--tag t] [--judge-model m] <evals-dir>`
re-applies the cases' *current* graders to the traces already recorded under
`--out`, rewrites each `result.json` (agent cost, turns, and model are carried
over; judge cost is whatever llm graders spend now) and recomputes
`aggregate-result.json`. Use it to calibrate graders against real traces
without paying for agents again. Graders that read the working tree
(`file_exists`, `postcheck`, `regex` with `target: files`) need the scaffold:
run with `--keep-temp` if you intend to regrade those, otherwise they fail
with a "needs the kept scaffold" detail.
