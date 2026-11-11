---
type: architecture
description: the two repositories, the dependency direction, how a run and a baseline flow through this one
---
# Architecture

Two repositories share the work. `weka/linter-driven-development` holds the plugins
users install and the documentation of how they are measured. This repository
holds everything that measures: the runner, one suite per language, and the
recorded baselines. It depends on the plugin repository; the plugin repository
never depends on it.

## Why two repositories

A plugin marketplace clones the whole plugin repository, history included, and
installing copies the plugin directory. Fixtures, traces and baselines would
ride along into every install and grow with every language. Keeping them here
keeps a plugin clone at about 2 MB.

## The contract

- **The pin.** Every baseline README and `aggregate-result.json` records the
  plugin commit and version the run measured. A local run records the plugin
  checkout's HEAD; CI checks out the plugin repository at a given ref first.
- **The copy.** The built-in `claude plugin eval` gate expects cases below the
  plugin directory. The `go:cases`, `py:cases` and `ts-react:cases` tasks copy their suite into
  `<plugin>/evals/`, a path the plugin repository ignores, so nothing is
  committed or shipped there. The copy is also where the plugin's command
  prefix is written: each suite's prompts, graders, postchecks and scaffolds
  name slash commands and the announcement line through the token
  `{{cmd_prefix}}`, and its `cases` task replaces it with `CMD_PREFIX` —
  read from the plugin's own `commands/` directory unless given on the command
  line — so the same Go cases measure `go-linter-driven-development` (`go-ldd`)
  and the generic `linter-driven-development` (`ldd`), and the same Python
  cases measure the Python plugin (`py-ldd`) and the generic one; the TypeScript +
  React suite's prefix is `tsr-ldd`, and its eight neutral cases carry no token at
  all so the hand-written 1.x plugin can answer them (the old-vs-new comparison
  in `ts-react/cases/NEUTRAL.md`). The copied
  suite stays concrete, which is what the gate and the runner read.
- **The hand-off.** The plugin repository's `scripts/evals.sh` clones this
  repository into an ignored `.evals/` directory and calls `task go:run` with
  `PLUGIN` set to its own plugin directory.
- **Baseline naming.** `baselines/<lang>-<plugin version>-<plugin sha7>/`. One
  directory per plugin state that becomes a reference. The default name assumes
  the plugin and the fixture share a language; when they do not — the generic
  `linter-driven-development` plugin measured on go-mini — the name carries the
  fixture instead, `generic-gomini-<version>-<sha7>`, given as `NAME` to the
  baseline task, and `plugin.json` in the baseline records the plugin either way.
- **Manifest ids.** `<lang>/violations.yaml` lists the planted violations and
  controls. The same id set appears in every language with language-specific
  anchors: `py/violations.yaml` carries go-mini's 159 ids over py-mini, and
  `ts-react/violations.yaml` carries them over ts-react-mini with a block of
  React-only ids appended and one more R5 plant, `R5.Q7.services-file-count`,
  for a directory only that fixture has over the limit; a comment on an entry
  says where the disease had to change with the language.
- **Suite defaults.** A suite's `cases/suite.yaml` names the source and test
  globs the runner's directory focus filters with; the Go suite names none and
  keeps the runner's Go default, the Python suite names `*.py` and `test_*.py`,
  the TypeScript + React suite `*.ts*` and `*.test.ts*`.

## A run

`task <lang>:run TIER=<tier> CAP=<usd> PLUGIN=<plugin dir>` (`go:run`, `py:run`, `ts-react:run`)
builds the runner, copies the suite below the plugin, and runs `ldd-eval run`
with the model pinned and the cost cap set. Results land in
`results/<lang>-<timestamp>/<tier>/` with one `result.json` and `trace.jsonl`
per case run and one `aggregate-result.json` per tier.

## A baseline

`task <lang>:baseline OUT=<run dir> PLUGIN=<plugin dir>` promotes a run: it
copies the verdicts, archives every trace into one local `traces.tar.zst` that git
ignores, writes the system temp folder in the verdicts as `$TMPDIR`, and writes
a README stub with the pass-rate table pre-filled (`go-…` for the Go suite,
`python-…` for the Python one, `ts-react-…` for the TypeScript + React one). `task <lang>:regrade OUT=<baseline> TIER=<tier>`
re-applies the current graders to the recorded traces after the archive is
unpacked beside the verdicts. Graders that read the scaffold tree
report "needs the kept scaffold" from a clone, because scaffolds are not
committed.

Some graders measure a capability that an older plugin does not have, so a
regrade of an older baseline fails them by design. Read such a grader as new
capability, not as a regression. The `recall-R5.Q7.*` graders of the
whole-repository review are of this kind. They need the package-size row that
the detection pass writes for R5 question 7, which the plugins get in
[weka/linter-driven-development#122](https://github.com/weka/linter-driven-development/pull/122)
(the gap linter counts the source files of each directory). On a baseline
recorded before that change, `review-full` fails one more grader in the Go and
Python suites and two more in the TypeScript + React suite, and
`review-full-neutral` fails the same two.

The private-leaf graders are of this kind too. They need the placement rules for
a private leaf in an I/O module and the ledger that the plugins get in
[weka/linter-driven-development#123](https://github.com/weka/linter-driven-development/pull/123).
Each suite adds two graders to `review-full`: `recall-R7.Q4.private-leaf-in-io`, which
fails on a baseline recorded before that change, and the control
`precision-CTRL.R4.trivial-private-in-io`, which passes. The TypeScript + React suite
adds the same two to `review-full-neutral`. Each suite also adds three cases:
`case-h-private-leaf-review` with 6 graders and `design-private-leaf` with 4, both in
the cheap tier, and `promote-private-leaf` in the medium tier, with 7 graders in the Go
suite and 6 in the Python and TypeScript + React suites. An older baseline has no
trace for these cases, so a regrade does not grade them.

The mechanism itself, the fixture, how to write a case and how to compare a
run against a baseline are documented in the plugin repository under
[docs/](https://github.com/weka/linter-driven-development/blob/main/docs/index.md).
