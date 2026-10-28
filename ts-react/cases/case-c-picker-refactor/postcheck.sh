#!/usr/bin/env bash
# Case C postcheck: tests/lint green, the picking step (whatever pick now calls)
# has cognitive complexity <= 5, no suppressions, black-box suite.
set -uo pipefail
here="$(dirname "$(readlink -f "$0")")"
# postcheck/lib.sh is two levels up in this repository (ts-react/cases/<case>/) and
# one level up when the suite is copied under <plugin>/evals/ for a run.
for lib in "$here/../../postcheck/lib.sh" "$here/../postcheck/lib.sh"; do
  [ -f "$lib" ] && { . "$lib"; break; }
done

assert "task test green" run_task test
assert "task lint green" run_task lint

pick_file=$(grep -lE '(function pick\(|^\s+pick\(|\bpick = )' "$EVAL_DIR"/src/pages/Devices/placement/*.ts 2>/dev/null | grep -vE '\.test\.' | head -1)
pick_file=${pick_file#"$EVAL_DIR"/}
assert "pick still exists in src/pages/Devices/placement" test -n "$pick_file"
if [[ -n "$pick_file" ]]; then
  worst=$(gocognit_of pick src/pages/Devices/placement)
  for callee in $(callees_in pick "$pick_file"); do
    c=$(gocognit_of "$callee" src/pages/Devices/placement) || continue
    echo "  cognitive($callee) = $c"
    ((c > worst)) && worst=$c
  done
  assert_le "cognitive complexity of pick and every helper it calls" "$worst" 5
fi

assert_eq "no suppression in src/pages/Devices/placement production code" "$(count_matches_prod "$SUPPRESSION_RE" 'src/pages/Devices/placement/*.ts')" 0
echo "== shipped =="
assert_ge "at least one commit after the scaffold base (the green tree is committed)" "$(commits_since_base)" 1
assert_eq "working tree clean at the end (nothing left uncommitted)" "$(git -C "$EVAL_DIR" status --porcelain | grep -c .)" 0

assert "black-box heartbeat suite" run_blackbox
finish
