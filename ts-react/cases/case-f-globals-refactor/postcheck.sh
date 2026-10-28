#!/usr/bin/env bash
# Case F postcheck: the ratchet over the commit history, clean islands, the
# shallow fix rejected, end state, test payoff, tests/lint green, black-box.
set -uo pipefail
here="$(dirname "$(readlink -f "$0")")"
# postcheck/lib.sh is two levels up in this repository (ts-react/cases/<case>/) and
# one level up when the suite is copied under <plugin>/evals/ for a run.
for lib in "$here/../../postcheck/lib.sh" "$here/../postcheck/lib.sh"; do
  [ -f "$lib" ] && { . "$lib"; break; }
done

assert "task test green" run_task test
assert "task lint green" run_task lint

echo "== the ratchet: CONFIG references outside src/main.tsx and src/config/, per commit =="
assert_ge "at least 3 commits after the scaffold base" "$(commits_since_base)" 3
assert "CONFIG references outside main.tsx and config/ never rise and end at 0" \
  ratchet_nonincreasing '\bCONFIG\b' 'src/*.ts' 'src/*.tsx' ':(exclude)src/main.tsx' ':(exclude)src/config/' ':(exclude)src/test-utils/'
echo "== directories changed in code, per commit (comment-only edits do not count) =="
pkgs_touched_per_commit
assert_le "no commit changes production code in more than 2 directories (island + its caller)" \
  "$(max_pkgs_touched_per_commit)" 2

echo "== islands are clean =="
assert_eq "export no longer imports config/env" "$(count_matches "from '[./]*config/env'" 'src/export/*.ts')" 0
assert_eq "the snapshot scheduler hook no longer imports config/env" "$(count_matches "from '[./]*config/env'" 'src/hooks/useSnapshotScheduler.ts' 'src/hooks/useSnapshotScheduler.tsx')" 0
assert_eq "shallow fix rejected: the whole configuration is not a parameter or prop type in export, hooks or pages" \
  "$(count_matches_prod ': (Config|Configuration|AppConfig|Env)\b' 'src/export/*.ts' 'src/hooks/*.ts' 'src/hooks/*.tsx' 'src/pages/**/*.ts' 'src/pages/**/*.tsx')" 0

echo "== end state =="
assert_eq "R8 Q1: no exported CONFIG or module-level region left in src/config" "$(count_matches_prod '^(export )?(const|let) (CONFIG|region)\b' 'src/config/*.ts')" 0
assert_eq "R8 Q2: no import-time environment read left in src/config" "$(count_matches_prod '^(export )?(const|let|var) [^=]*= [^\n]*import\.meta\.env' 'src/config/*.ts')" 0
assert_eq "no suppression in src/config" "$(count_suppressions 'src/config/*.ts')" 0
assert_eq "no suppression in src/export" "$(count_suppressions 'src/export/*.ts')" 0

echo "== test payoff =="
assert_eq "R8 Q6: no test assigns into CONFIG" "$(count_matches 'CONFIG\.\w+ = ' 'src/**/*.test.ts' 'src/**/*.test.tsx')" 0
assert_ge "the export worker tests hand the concurrency in as a value" "$(count_matches '(workers|concurrency|parallelism|numWorkers)[:=] ?[0-9]|\w+\([a-zA-Z_]+, [0-9]+\)' 'src/export/*.test.ts')" 1

assert "black-box heartbeat suite" run_blackbox
finish
