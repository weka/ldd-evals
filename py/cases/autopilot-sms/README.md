# autopilot-sms — the expensive-tier workflow case

`Implement SPEC.md` over py-mini. SPEC.md (amended into the base commit by `scaffold.sh`) adds an
sms alert channel: E.164 recipients, 160-char truncation, a 10 s retry, delivery through the
existing webhook, DOWN-transition alerting via `ONCALL_PHONE`, and `GET /channels`.

**Cost.** One run drives all five phases plus PREPARE with hunter, skeptic and critic agents:
expect **$15–40 on claude-sonnet-5** and 30–90 minutes (`max_turns: 300`, `timeout_seconds: 7200`,
`runs: 1`). Run on release tags only: `ldd-eval run --case autopilot-sms --runs 1 --max-cost-usd 50 --keep-temp <evals-dir>`.

**What it proves.** Deterministic graders check phase order (design before any Python write/edit,
RED before GREEN, full lint before review, ≤1 design escalation), the PREPARE gates (PREPARATION
LOG, a MULTIPLY hit naming R11), the agents (lint-fixer, rule hunters) and the R11 end state
(a channel parser or `Channel` enum, sms in its own module). `postcheck.sh` re-runs
build/test/lint and the hidden black-box suite, smokes `GET /channels` on the running service,
reads the git history (≥3 commits, prep before the first sms commit) and enforces when-in-Rome
(pyproject.toml unchanged, no third-party imports, no new `# noqa`, `# type: ignore` or `# ty: ignore`, no global
mutation in new tests, no net new module in RED-zone `internal/models`, assertions not weakened).
One llm judge scores the ship summary.

**Pre-approval caveat — a plugin finding.** Autopilot stops for the user to approve the DESIGN PLAN,
answer Option A/B and commit; headless runs have no user. `prompt.md`'s `append_system_prompt`
pre-approves those steps and forbids new dependencies — the eval's workaround, not plugin behavior:
autopilot has no non-interactive mode today. Two more: the Go plugin's package-size hook is opt-in
and the Python plugin's is stream 2's to define, so the RED-zone message is unobservable (postcheck
NOTEs the hook state); and postcheck runs last, so no judge reads the DESIGN PLAN — it lands in
`$EVAL_OUT/design-plan.txt`.
