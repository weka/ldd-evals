#!/usr/bin/env bash
# Case E postcheck: path-scoped R2 oracles in internal/report, the R6 guard
# rail (no new Protocol), tests/lint green, black-box suite.
set -uo pipefail
here="$(dirname "$(readlink -f "$0")")"
# postcheck/lib.sh is two levels up in this repository (py/cases/<case>/) and one
# level up when the suite is copied under <plugin>/evals/ for a run.
for lib in "$here/../../postcheck/lib.sh" "$here/../postcheck/lib.sh"; do
  [ -f "$lib" ] && { . "$lib"; break; }
done

assert "task test green" run_task test
assert "task lint green" run_task lint

assert_eq "R2 Q2: no attribute None re-check inside internal/report methods" \
  "$(count_matches_prod 'if self\.\w+ is None' 'internal/report/*.py')" 0
# The blank-line None in parse_device is a declared absence and stays; the
# malformed-line None was a failure and becomes a raise.
assert_le "R2 Q5: at most the blank-line 'return None' left in catalog.py" "$(count_matches 'return None$' 'internal/report/catalog.py')" 1
assert_ge "R2 Q5: a malformed catalog line raises in catalog.py" "$(count_matches 'raise \w*Error' 'internal/report/catalog.py')" 1
assert_eq "R2 Q5: no tuple[Device, bool] shape introduced" "$(count_matches 'tuple\[Device, bool\]' 'internal/report/*.py')" 0
assert_le "R2 Q1: Reporter constructed in production only at its one wiring site" \
  "$(count_matches_prod '\bReporter\(' 'internal/report/*.py')" 1
# The null object is CALLED somewhere in the package, not just declared. The
# fixture's only "no sink" caller is the test that used to pass None, so test
# files count.
assert_ge "a default/system/discard/nop constructor is CALLED (not just declared) in internal/report" \
  "$(count_matches '^\s.*\b([Dd]efault|[Ss]ystem|[Dd]iscard|[Nn]op|[Nn]oop|[Nn]ull)\w*\(\)' 'internal/report/*.py')" 1
# R6 guard rail: the fixture's report package declares no Protocol; replacing
# the optional Sink with a Sink Protocol "for testability" is the tempting
# wrong fix (a Callable alias like Clock is fine — it is not a Protocol).
assert_eq "R6 Q1: no Protocol or ABC introduced in internal/report" "$(count_matches_prod '\((Protocol|ABC)\)' 'internal/report/*.py')" 0
assert_eq "no # noqa added to internal/report" "$(count_matches '# noqa' 'internal/report/*.py')" 0
echo "== shipped =="
assert_ge "at least one commit after the scaffold base (the green tree is committed)" "$(commits_since_base)" 1
assert_eq "working tree clean at the end (nothing left uncommitted)" "$(git -C "$EVAL_DIR" status --porcelain | grep -c .)" 0

assert "black-box heartbeat suite" run_blackbox
finish
