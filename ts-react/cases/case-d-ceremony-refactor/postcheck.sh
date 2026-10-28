#!/usr/bin/env bash
# Case D postcheck: ReplicaCount is gone or untouched (never grown), tests and
# lint green, black-box suite.
set -uo pipefail
here="$(dirname "$(readlink -f "$0")")"
# postcheck/lib.sh is two levels up in this repository (ts-react/cases/<case>/) and
# one level up when the suite is copied under <plugin>/evals/ for a run.
for lib in "$here/../../postcheck/lib.sh" "$here/../postcheck/lib.sh"; do
  [ -f "$lib" ] && { . "$lib"; break; }
done

assert "task test green" run_task test
assert "task lint green" run_task lint

# Members of ReplicaCount: the method and field lines between its declaration
# and the next top-level declaration, across the production modules of src/.
replica_members=$(cd "$EVAL_DIR" && shopt -s nullglob globstar && for f in src/**/*.ts src/**/*.tsx; do
  _is_prod_ts "$f" || continue
  grep -qE '^export (class|type|interface) ReplicaCount\b' "$f" || continue
  awk '/^export (class|type|interface) ReplicaCount\b/ {p=1; next} p && /^(export |class |function |const |type |interface )/ {exit} p && /^  [A-Za-z_#][A-Za-z0-9_]*(\(|:| =)/ {n++} END {print n+0}' "$f"; done | awk '{s+=$1} END {print s+0}')
assert_le "ReplicaCount has at most its original single member (deleted or untouched, never grown)" "$replica_members" 1
assert_le "ReplicaCount is declared at most once" "$(count_matches_prod '^export (class|type|interface) ReplicaCount\b' 'src/**/*.ts' 'src/**/*.tsx')" 1
assert_eq "no TraceId-like wrapper appeared anywhere" "$(count_matches_prod '(class|type|interface) Trace(ID|Id)\b' 'src/**/*.ts' 'src/**/*.tsx')" 0
echo "== shipped =="
assert_ge "at least one commit after the scaffold base (the green tree is committed)" "$(commits_since_base)" 1
assert_eq "working tree clean at the end (nothing left uncommitted)" "$(git -C "$EVAL_DIR" status --porcelain | grep -c .)" 0

assert "black-box heartbeat suite" run_blackbox
finish
