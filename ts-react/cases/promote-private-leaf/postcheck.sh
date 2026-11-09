#!/usr/bin/env bash
# promote-private-leaf postcheck: expandEnv left the I/O module for a nested
# folder module that has its own tests and full coverage, trimSlash stayed, no
# test-only export exists, build and tests are green, the work is committed.
set -uo pipefail
here="$(dirname "$(readlink -f "$0")")"
for lib in "$here/../../postcheck/lib.sh" "$here/../postcheck/lib.sh"; do
  [ -f "$lib" ] && { . "$lib"; break; }
done

IO_FILE=src/services/transport/webhook.ts

# nested_modules — folders one level below src/services/transport that hold a
# non-test TypeScript file.
nested_modules() {
	local d
	for d in "$EVAL_DIR"/src/services/transport/*/; do
		[ -d "$d" ] || continue
		find "$d" -maxdepth 1 -name '*.ts' ! -name '*.test.ts' 2>/dev/null | grep -q . && basename "$d"
	done
}

# has_own_test <dir> — the folder holds at least one *.test.ts file.
has_own_test() {
	ls "$EVAL_DIR/src/services/transport/$1/"*.test.ts >/dev/null 2>&1
}

# full_coverage <dir> — the folder's own tests cover it at 100 percent.
full_coverage() {
	local out rc=0
	out=$(cd "$EVAL_DIR" && CI=1 npx --no vitest run --coverage \
		"--coverage.include=src/services/transport/$1/**" \
		--coverage.thresholds.100=true "src/services/transport/$1" 2>&1) || rc=$?
	echo "$out" | tail -15
	return $rc
}

assert "task build green" run_task build
assert "task test green" run_task test

nested=()
while IFS= read -r mod; do
	[ -n "$mod" ] && nested+=("$mod")
done < <(nested_modules)
assert_ge "a nested folder module exists below src/services/transport" "${#nested[@]}" 1
for mod in ${nested[@]+"${nested[@]}"}; do
	assert "nested module $mod has its own test file" has_own_test "$mod"
	assert "nested module $mod is covered at 100 percent" full_coverage "$mod"
done

assert_eq "expandEnv is no longer defined in webhook.ts" "$(count_matches '^(export )?function expandEnv\(' "$IO_FILE")" 0
assert_eq "trimSlash is still defined in webhook.ts" "$(count_matches '^(export )?function trimSlash\(' "$IO_FILE")" 1
assert_ge "webhook.ts imports a nested module" "$(count_matches "^import .* from '\./[A-Za-z0-9_-]+(/[A-Za-z0-9_.-]+)?'" "$IO_FILE")" 1

# No door for tests: no __testing hook and no test-only export.
assert_eq "no test-only export in the tree" "$(count_matches '__testing|ForTesting|exportedForTest' 'src/**/*.ts' 'src/**/*.tsx')" 0

assert_ge "at least one commit after the scaffold" "$(commits_since_base)" 1
assert "clean tree at the end" git -C "$EVAL_DIR" diff --quiet HEAD
finish
