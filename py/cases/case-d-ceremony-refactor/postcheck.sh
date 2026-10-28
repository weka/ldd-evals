#!/usr/bin/env bash
# Case D postcheck: ReplicaCount is gone or untouched (never grown), tests and
# lint green, black-box suite.
set -uo pipefail
here="$(dirname "$(readlink -f "$0")")"
# postcheck/lib.sh is two levels up in this repository (py/cases/<case>/) and one
# level up when the suite is copied under <plugin>/evals/ for a run.
for lib in "$here/../../postcheck/lib.sh" "$here/../postcheck/lib.sh"; do
  [ -f "$lib" ] && { . "$lib"; break; }
done

assert "task test green" run_task test
assert "task lint green" run_task lint

# Methods of ReplicaCount: the def lines between its class line and the next
# top-level class or def, across the production modules of internal/.
replica_methods=$(cd "$EVAL_DIR" && shopt -s nullglob globstar && for f in internal/**/*.py; do
  [[ "$(basename "$f")" == test_*.py ]] && continue
  grep -qE '^class ReplicaCount' "$f" || continue
  awk '/^class ReplicaCount/ {p=1; next} p && /^(class|def) / {exit} p && /^[ \t]+def / {n++} END {print n+0}' "$f"; done | awk '{s+=$1} END {print s+0}')
assert_le "ReplicaCount has at most its original single method (deleted or untouched, never grown)" "$replica_methods" 1
assert_le "ReplicaCount is declared at most once" "$(count_matches_prod '^class ReplicaCount' 'internal/**/*.py')" 1
assert_eq "no TraceId-like wrapper appeared anywhere" "$(count_matches_prod '^class Trace(ID|Id)\b' 'internal/**/*.py' 'svc/**/*.py')" 0
echo "== shipped =="
assert_ge "at least one commit after the scaffold base (the green tree is committed)" "$(commits_since_base)" 1
assert_eq "working tree clean at the end (nothing left uncommitted)" "$(git -C "$EVAL_DIR" status --porcelain | grep -c .)" 0

assert "black-box heartbeat suite" run_blackbox
finish
