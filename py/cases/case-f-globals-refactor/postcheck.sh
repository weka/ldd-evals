#!/usr/bin/env bash
# Case F postcheck: the ratchet over the commit history, clean islands, the
# shallow fix rejected, end state, test payoff, tests/lint green, black-box.
set -uo pipefail
here="$(dirname "$(readlink -f "$0")")"
# postcheck/lib.sh is two levels up in this repository (py/cases/<case>/) and one
# level up when the suite is copied under <plugin>/evals/ for a run.
for lib in "$here/../../postcheck/lib.sh" "$here/../postcheck/lib.sh"; do
  [ -f "$lib" ] && { . "$lib"; break; }
done

assert "task test green" run_task test
assert "task lint green" run_task lint

echo "== the ratchet: env.CONFIG references outside svc/, per commit =="
assert_ge "at least 3 commits after the scaffold base" "$(commits_since_base)" 3
assert "env.CONFIG references outside svc/ never rise and end at 0" \
  ratchet_nonincreasing 'env\.CONFIG\b' '*.py' ':(exclude)svc/'
echo "== packages changed in code, per commit (comment-only edits do not count) =="
pkgs_touched_per_commit
assert_le "no commit changes production code in more than 2 packages (island + its caller)" \
  "$(max_pkgs_touched_per_commit)" 2

echo "== islands are clean =="
assert_eq "pool no longer imports env" "$(count_matches 'from internal\.env|import internal\.env' 'internal/pool/*.py')" 0
assert_eq "jobs no longer imports env" "$(count_matches 'from internal\.env|import internal\.env' 'internal/jobs/*.py')" 0
assert_eq "shallow fix rejected: Configuration is not a parameter or attribute type in pool, jobs or handlers" \
  "$(count_matches '\bConfiguration\b' 'internal/pool/*.py' 'internal/jobs/*.py' 'internal/handlers/*.py')" 0

echo "== end state =="
assert_eq "R8 Q1: no module-level CONFIG or _region left in internal/env" "$(count_matches_prod '^(CONFIG|_region)\b' 'internal/env/*.py')" 0
assert_eq "R8 Q2: no import-time environment read left in internal/env" "$(count_matches_prod '^_?[a-z_]+ = os\.environ' 'internal/env/*.py')" 0
assert_eq "R8 Q2: no global statement left in internal/env" "$(count_matches_prod '^\s+global ' 'internal/env/*.py')" 0
assert_eq "no # noqa in internal/env" "$(count_matches '# noqa' 'internal/env/*.py')" 0
assert_eq "no # noqa in internal/pool" "$(count_matches '# noqa' 'internal/pool/*.py')" 0
assert_eq "no noqa: PLW0603 anywhere for the config global" "$(count_matches 'noqa: PLW0603' 'internal/env/*.py' 'internal/pool/*.py' 'svc/**/*.py')" 0

echo "== test payoff =="
assert_eq "R8 Q6: no test mutates env.CONFIG" "$(count_matches 'CONFIG\.\w+ =' 'internal/**/test_*.py' 'svc/**/test_*.py')" 0
assert_ge "the pool tests hand the worker count in as a value" "$(count_matches '(workers|num_workers)=[0-9]|start\([a-z_]+, [0-9]|Pool\([0-9]|Config\(workers=' 'internal/pool/test_*.py')" 1

assert "black-box heartbeat suite" run_blackbox
finish
