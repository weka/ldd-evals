#!/usr/bin/env bash
# quickfix-red-lint postcheck — runs in the kept scaffold after /{{cmd_prefix}}-quickfix.
#   1. eslint.config.js (the lint configuration) is byte-identical to the
#      fixture's original, and package.json is unchanged (lint-fixer hard limits)
#   2. task test is green
#   3. lint issue count (eslint + tsc) is reported (informational — escalations may be pending)
#   4. no *.test.ts(x) lost an assertion line versus postcheck/assertion-counts.txt
set -uo pipefail
here="$(dirname "$(readlink -f "${BASH_SOURCE[0]}")")"
# postcheck/lib.sh is two levels up in this repository (ts-react/cases/<case>/) and
# one level up when the suite is copied under <plugin>/evals/ for a run.
for lib in "$here/../../postcheck/lib.sh" "$here/../postcheck/lib.sh"; do
  [ -f "$lib" ] && { . "$lib"; break; }
done

assert_lint_config_unchanged
assert "package.json unchanged from the fixture's original (no dependency or script changes)" \
	file_unchanged_since_base package.json

assert "task test green" run_task test

echo "info  lint issues remaining (eslint + tsc): $(lint_issue_count)"
echo "info  commits since scaffold: $(commits_since_base)"

assert_assertions_kept "$LDD_POSTCHECK_DIR/assertion-counts.txt"

finish
