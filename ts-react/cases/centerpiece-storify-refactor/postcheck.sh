#!/usr/bin/env bash
# Centerpiece postcheck: complexity of processHeartbeat, the R1/R3/R10 oracles
# scoped to src/pages/Heartbeats (baselines read from the base commit so the
# fixture's unrelated plants do not fail the case), rung-0 parse test,
# tests/lint green, and the hidden black-box suite as the behavior oracle.
set -uo pipefail
here="$(dirname "$(readlink -f "$0")")"
# postcheck/lib.sh is two levels up in this repository (ts-react/cases/<case>/) and
# one level up when the suite is copied under <plugin>/evals/ for a run.
for lib in "$here/../../postcheck/lib.sh" "$here/../postcheck/lib.sh"; do
  [ -f "$lib" ] && { . "$lib"; break; }
done

assert "task test green" run_task test
assert "task lint green" run_task lint

echo "== complexity =="
assert_le "cognitive complexity of processHeartbeat (was >= 60)" "$(gocognit_of processHeartbeat src/pages/Heartbeats)" 10
assert_le "cyclomatic complexity of processHeartbeat" "$(gocyclo_of processHeartbeat src/pages/Heartbeats)" 8

ph_file=$(grep -lE '(function processHeartbeat\(|processHeartbeat = )' "$EVAL_DIR"/src/pages/Heartbeats/*.ts 2>/dev/null | grep -vE '\.test\.' | head -1)
ph_file=${ph_file#"$EVAL_DIR"/}
assert "processHeartbeat still defined in src/pages/Heartbeats" test -n "$ph_file"
if [[ -n "$ph_file" ]]; then
  body=$(func_body processHeartbeat "$ph_file")
  assert_eq "R1 Q3: no status string-literal comparison inside processHeartbeat" "$(grep -cE "(===|!==) '[A-Z]+'" <<<"$body")" 0
  assert_eq "R3 Q2: no split/trim/index manipulation inside processHeartbeat" "$(grep -cE '\.(split|trim|toUpperCase|toLowerCase)\(|\[[0-9]+\]|\.(slice|substring)\([0-9]+\)' <<<"$body")" 0
  assert_eq "no suppression on processHeartbeat" "$(grep -B1 -A4 -E '(function processHeartbeat\(|processHeartbeat = )' "$EVAL_DIR/$ph_file" | grep -cE "$SUPPRESSION_RE")" 0
fi

echo "== Heartbeats-scoped oracles (baseline = scaffold base commit) =="
base=$(base_commit)
hb_prod=('src/pages/Heartbeats/*.ts' ':(exclude)src/pages/Heartbeats/*.test.ts')
assert_le "R10 Q5: the retry sleep is gone (setTimeout-promise count below baseline)" "$(count_matches_prod 'new Promise\([^)]*setTimeout' 'src/pages/Heartbeats/*.ts')" \
  "$(( $(count_matches_at "$base" 'new Promise\([^)]*setTimeout' "${hb_prod[@]}") - 1 ))"
# A tuple return type with four or more members: the function's own `): [`, or the
# `type X = [` alias it returns through (HeartbeatOutcome, ParsedLine). Array
# literals (`const X = [...]`) do not count.
TUPLE4_RE='(type \w+ = |\): )(Promise<)?\[([^,]*,){3}'
assert_le "R1 Q5: tuple types with 4+ members on the heartbeat path (processHeartbeat's gone)" "$(count_matches_prod "$TUPLE4_RE" 'src/pages/Heartbeats/*.ts')" \
  "$(( $(count_matches_at "$base" "$TUPLE4_RE" "${hb_prod[@]}") - 1 ))"
assert_le "R1 Q3: 'READY' literal has one owner on the heartbeat path (3 fewer than baseline)" "$(count_matches_prod "'READY'" 'src/pages/Heartbeats/*.ts')" \
  "$(( $(count_matches_at "$base" "'READY'" "${hb_prod[@]}") - 2 ))"
assert_le "R3 Q4: the continue-driven dedupe left processHeartbeat" "$(count_matches_prod '^\s+continue$' 'src/pages/Heartbeats/*.ts')" \
  "$(( $(count_matches_at "$base" '^\s+continue$' "${hb_prod[@]}") - 1 ))"

echo "== the parse leaf =="
parse_total=$(count_matches_prod '(parse\w*[Hh]eartbeat\w*|Heartbeat\w*\.(parse|from)\w*|parseLine)\(' 'src/**/*.ts' 'src/**/*.tsx')
parse_decls=$(count_matches_prod '^\s*(export )?(function|const) (parse\w*[Hh]eartbeat\w*|parseLine)\b|^\s*(static )?(parse|from)\w*\(|^\s*(//|\*).*(parse\w*[Hh]eartbeat\w*|Heartbeat\w*\.parse|parseLine)\(' 'src/**/*.ts' 'src/**/*.tsx')
assert_ge "production code CALLS a heartbeat parser (declarations and comments excluded)" "$((parse_total - parse_decls))" 1
assert_ge "R7: a rung-0 test calls the heartbeat parser with a literal" \
  "$(external_test_calls "(parse\w*[Hh]eartbeat\w*|Heartbeat\w*\.(parse|from)\w*|parseLine)\('" 'src/**/*.test.ts' 'src/**/*.test.tsx')" 1
echo "== shipped =="
assert_ge "at least one commit after the scaffold base (the green tree is committed)" "$(commits_since_base)" 1
assert_eq "working tree clean at the end (nothing left uncommitted)" "$(git -C "$EVAL_DIR" status --porcelain | grep -c .)" 0

assert "black-box heartbeat suite" run_blackbox
finish
