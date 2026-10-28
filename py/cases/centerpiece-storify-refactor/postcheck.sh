#!/usr/bin/env bash
# Centerpiece postcheck: complexity of process_heartbeat, the R1/R8/R10/R12
# oracles scoped to internal/services (baselines read from the base commit so
# the fixture's unrelated plants do not fail the case), rung-0 parse test,
# tests/lint green, and the hidden black-box suite as the behavior oracle.
set -uo pipefail
here="$(dirname "$(readlink -f "$0")")"
# postcheck/lib.sh is two levels up in this repository (py/cases/<case>/) and one
# level up when the suite is copied under <plugin>/evals/ for a run.
for lib in "$here/../../postcheck/lib.sh" "$here/../postcheck/lib.sh"; do
  [ -f "$lib" ] && { . "$lib"; break; }
done

assert "task test green" run_task test
assert "task lint green" run_task lint

echo "== complexity =="
assert_le "cognitive complexity of process_heartbeat (was 76)" "$(gocognit_of process_heartbeat internal/services)" 10
assert_le "cyclomatic complexity of process_heartbeat (was 39)" "$(gocyclo_of process_heartbeat internal/services)" 8

ph_file=$(grep -lE '^\s+def process_heartbeat\(' "$EVAL_DIR"/internal/services/*.py 2>/dev/null | grep -v test_ | head -1)
ph_file=${ph_file#"$EVAL_DIR"/}
assert "process_heartbeat still defined in internal/services" test -n "$ph_file"
if [[ -n "$ph_file" ]]; then
  body=$(func_body process_heartbeat "$ph_file")
  assert_eq "R1 Q3: no status string-literal comparison inside process_heartbeat" "$(grep -cE '(==|!=) "[A-Z]+"' <<<"$body")" 0
  assert_eq "R3 Q2: no split/strip/index manipulation inside process_heartbeat" "$(grep -cE '\.(split|strip|upper)\(|\[[0-9]+\]|\[[0-9]+:\]' <<<"$body")" 0
  assert_eq "no # noqa on process_heartbeat" "$(grep -B1 -A4 -E '^\s+def process_heartbeat\(' "$EVAL_DIR/$ph_file" | grep -c 'noqa')" 0
fi

echo "== services-scoped oracles (baseline = scaffold base commit) =="
base=$(base_commit)
svc_prod=('internal/services/*.py' ':(exclude)internal/services/test_*.py')
assert_eq "R8 Q3: logging.basicConfig gone from internal/services" "$(count_matches_prod '^logging\.basicConfig\(' 'internal/services/*.py')" 0
assert_le "R10 Q5: the retry sleep is gone (time.sleep count below baseline)" "$(count_matches_prod 'time\.sleep' 'internal/services/*.py')" \
  "$(( $(count_matches_at "$base" 'time\.sleep' "${svc_prod[@]}") - 1 ))"
assert_le "R1 Q5: functions returning 4+ values (process_heartbeat's gone)" "$(count_matches_prod '-> tuple\[[^]]*,[^]]*,[^]]*,' 'internal/services/*.py')" \
  "$(( $(count_matches_at "$base" '-> tuple\[[^]]*,[^]]*,[^]]*,' "${svc_prod[@]}") - 1 ))"
assert_le "R1 Q3: \"READY\" literal has one owner on the heartbeat path (3 fewer than baseline)" "$(count_matches_prod '"READY"' 'internal/services/*.py')" \
  "$(( $(count_matches_at "$base" '"READY"' "${svc_prod[@]}") - 2 ))"
assert_le "R3 Q4: the for/else dedupe left process_heartbeat" "$(count_matches_prod 'already added\. skip' 'internal/services/*.py')" \
  "$(( $(count_matches_at "$base" 'already added\. skip' "${svc_prod[@]}") - 1 ))"

echo "== the parse leaf =="
parse_total=$(count_matches_prod '(parse\w*heartbeat\w*|Heartbeat\w*\.parse)\(' 'internal/**/*.py')
parse_decls=$(count_matches_prod '^\s*def parse\w*heartbeat\w*\(|^\s*#.*(parse\w*heartbeat\w*|Heartbeat\w*\.parse)\(' 'internal/**/*.py')
assert_ge "production code CALLS a heartbeat parser (declarations and comments excluded)" "$((parse_total - parse_decls))" 1
assert_ge "R7: a rung-0 test module calls the heartbeat parser with a literal" \
  "$(external_test_calls '(parse\w*heartbeat\w*|Heartbeat\w*\.parse)\("' 'internal/**/test_*.py')" 1
echo "== shipped =="
assert_ge "at least one commit after the scaffold base (the green tree is committed)" "$(commits_since_base)" 1
assert_eq "working tree clean at the end (nothing left uncommitted)" "$(git -C "$EVAL_DIR" status --porcelain | grep -c .)" 0

assert "black-box heartbeat suite" run_blackbox
finish
