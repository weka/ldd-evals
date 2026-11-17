#!/usr/bin/env bash
# mutation-leaf-kill postcheck: the three leaf packages have no unrecorded
# survivor, production code is untouched, the suite and lint are green, the
# work is committed.
set -uo pipefail
here="$(dirname "$(readlink -f "$0")")"
for lib in "$here/../../postcheck/lib.sh" "$here/../postcheck/lib.sh"; do
  [ -f "$lib" ] && { . "$lib"; break; }
done

# The pinned gremlins from the shared tools folder (lib.sh installs it once).
GREMLINS=$(gremlins_bin)

# lived_in <pkg-dir> — count of LIVED lines gremlins reports for one package;
# a run that fails or times out counts as "everything lived" so it cannot pass.
# gremlins gives each mutant three times the coverage run's duration. On a fast
# host the mutant's own compile takes longer, so mutants time out at random.
# The coefficient is the fixture's .gremlins.yaml value, given here as a flag
# so that an edit to that file cannot change the result.
lived_in() {
	local out
	[[ -n "$GREMLINS" ]] || { echo 999; return; }
	out=$(cd "$EVAL_DIR" && "$GREMLINS" unleash --timeout-coefficient 50 "./$1" 2>&1) || { echo 999; return; }
	grep -qE 'Timed out: [1-9]' <<<"$out" && { echo 999; return; }
	grep -cE '^\s*LIVED' <<<"$out" || true
}

# nolint_count <rev> — //nolint directives in the three packages at a revision.
nolint_count() {
	git -C "$EVAL_DIR" grep -h '//nolint' "$1" -- internal/pkg/deviceid internal/models internal/utils 2>/dev/null | wc -l
}

assert "task test green" run_task test
assert "task lint green" run_task lint

assert_eq "deviceid: no surviving mutant" "$(lived_in internal/pkg/deviceid)" 0
assert_eq "models: no surviving mutant" "$(lived_in internal/models)" 0

# utils: the Slugify survivor must die; Truncate's two equivalent mutants may
# live only when a comment beside the tests says why.
utils_lived=$(lived_in internal/utils)
if grep -qiE 'equivalent' "$EVAL_DIR"/internal/utils/*_test.go; then
	assert_le "utils: at most the two recorded equivalent mutants live" "$utils_lived" 2
else
	assert_eq "utils: no surviving mutant (none recorded as equivalent)" "$utils_lived" 0
fi

# Rows, not rewrites: production files are byte-identical to the scaffold.
for f in internal/pkg/deviceid/deviceid.go internal/models/tenant.go internal/utils/strings.go; do
	assert "production file untouched: $f" file_unchanged_since_base "$f"
done

# Package-scoped, as R7 says: gremlins never ran over the module root.
module_wide=$(grep -c 'gremlins unleash \./\.\.\.' "$EVAL_OUT/trace.jsonl" 2>/dev/null)
assert_eq "no module-wide mutation run (gremlins unleash ./... in the trace)" "${module_wide:-0}" 0

assert_eq "no //nolint added to the three packages" "$(nolint_count HEAD)" "$(nolint_count "$(base_commit)")"
assert_ge "at least one commit after the scaffold" "$(commits_since_base)" 1
assert "clean tree at the end" git -C "$EVAL_DIR" diff --quiet HEAD
assert "black-box heartbeat suite" run_blackbox
finish
