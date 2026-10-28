#!/usr/bin/env bash
# Case E postcheck: path-scoped R2 oracles in src/features/report, the R6
# guard rail (no new interface), tests/lint green, black-box suite.
set -uo pipefail
here="$(dirname "$(readlink -f "$0")")"
# postcheck/lib.sh is two levels up in this repository (ts-react/cases/<case>/) and
# one level up when the suite is copied under <plugin>/evals/ for a run.
for lib in "$here/../../postcheck/lib.sh" "$here/../postcheck/lib.sh"; do
  [ -f "$lib" ] && { . "$lib"; break; }
done

assert "task test green" run_task test
assert "task lint green" run_task lint

assert_eq "R2 Q2: no field undefined re-check inside src/features/report methods" \
  "$(count_matches_prod '!this\.#?_?(sink|clock)\b|this\.#?_?(sink|clock) (===|!==|==|!=) (undefined|null)|this\.#?_?(sink|clock)(\?\.| \?\? )' 'src/features/report/*.ts')" 0
# The blank-line null in parseDevice is a declared absence and stays; the
# malformed-line null was a failure and becomes a throw.
assert_le "R2 Q5: at most the blank-line 'return null' left in catalog.ts" "$(count_matches 'return (null|undefined)$' 'src/features/report/catalog.ts')" 1
assert_ge "R2 Q5: a malformed catalog line throws in catalog.ts" "$(count_matches 'throw new \w*Error' 'src/features/report/catalog.ts')" 1
assert_eq "R2 Q5: no [(Catalog)Device, boolean] tuple shape introduced" "$(count_matches '\[(Catalog)?Device, boolean\]' 'src/features/report/*.ts')" 0
assert_le "R2 Q1: Reporter constructed in production only at its one wiring site" \
  "$(count_matches_prod 'new Reporter\(' 'src/features/report/*.ts')" 1
# The null object is CALLED or passed somewhere in the folder, not just
# declared. The fixture's only "no sink" caller is the test that used to pass
# undefined, so test files count.
assert_ge "a default/system/discard/nop value is USED (not just declared) in src/features/report" \
  "$(count_matches '^\s.*\b([Dd]efault|[Ss]ystem|[Dd]iscard|[Nn]op|[Nn]oop|[Nn]ull)\w*(\(\)|,|\))' 'src/features/report/*.ts')" 1
# R6 guard rail: replacing the optional Sink with a new Sink interface "for
# testability" is the tempting wrong fix; the folder's interface count must
# not grow past the base commit's.
base=$(base_commit)
assert_le "R6 Q1: no new interface or abstract class introduced in src/features/report" \
  "$(count_matches_prod '^export (interface|abstract class) ' 'src/features/report/*.ts')" \
  "$(count_matches_at "$base" '^export (interface|abstract class) ' 'src/features/report/*.ts' ':(exclude)src/features/report/*.test.ts')"
assert_eq "no suppression added to src/features/report" "$(count_suppressions 'src/features/report/*.ts')" 0
echo "== shipped =="
assert_ge "at least one commit after the scaffold base (the green tree is committed)" "$(commits_since_base)" 1
assert_eq "working tree clean at the end (nothing left uncommitted)" "$(git -C "$EVAL_DIR" status --porcelain | grep -c .)" 0

assert "black-box heartbeat suite" run_blackbox
finish
