#!/usr/bin/env bash
# quickfix-red-lint postcheck — runs in the kept scaffold after /{{cmd_prefix}}-quickfix.
#   1. pyproject.toml (the ruff and mypy configuration) is byte-identical to the
#      fixture's original (lint-fixer hard limit)
#   2. task test is green
#   3. lint issue count (ruff + mypy) is reported (informational — escalations may be pending)
#   4. no test_*.py lost an assertion line versus postcheck/assertion-counts.txt
set -uo pipefail
here="$(dirname "$(readlink -f "${BASH_SOURCE[0]}")")"
# postcheck/lib.sh is two levels up in this repository (py/cases/<case>/) and one
# level up when the suite is copied under <plugin>/evals/ for a run.
for lib in "$here/../../postcheck/lib.sh" "$here/../postcheck/lib.sh"; do
  [ -f "$lib" ] && { . "$lib"; break; }
done

if ! cmp -s "$EVAL_DIR/pyproject.toml" "$LDD_POSTCHECK_DIR/pyproject.orig.toml"; then
	diff -u "$LDD_POSTCHECK_DIR/pyproject.orig.toml" "$EVAL_DIR/pyproject.toml" | head -n 40 || true
fi
assert "pyproject.toml unchanged from the fixture's original" \
	cmp -s "$EVAL_DIR/pyproject.toml" "$LDD_POSTCHECK_DIR/pyproject.orig.toml"

assert "task test green" run_task test

echo "info  lint issues remaining (ruff + mypy): $(lint_issue_count)"
echo "info  commits since scaffold: $(commits_since_base)"

assert_assertions_kept "$LDD_POSTCHECK_DIR/assertion-counts.txt"

finish
