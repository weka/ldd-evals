#!/usr/bin/env bash
# promote-private-leaf postcheck: expandEnv left the I/O file for a nested package
# that has its own tests and full coverage, trimSlash stayed, no test-only export
# exists, the build and the tests are green, the work is committed.
set -uo pipefail
here="$(dirname "$(readlink -f "$0")")"
for lib in "$here/../../postcheck/lib.sh" "$here/../postcheck/lib.sh"; do
  [ -f "$lib" ] && { . "$lib"; break; }
done

IO_FILE=internal/transport/webhook.go

# nested_packages — directories one level below internal/transport that hold a
# non-test Go file.
nested_packages() {
	local d
	for d in "$EVAL_DIR"/internal/transport/*/; do
		[ -d "$d" ] || continue
		find "$d" -maxdepth 1 -name '*.go' ! -name '*_test.go' 2>/dev/null | grep -q . && basename "$d"
	done
}

# has_own_test <dir> — the directory holds at least one _test.go file.
has_own_test() {
	ls "$EVAL_DIR/internal/transport/$1/"*_test.go >/dev/null 2>&1
}

# full_coverage <dir> — go test reports 100.0% for the nested package.
full_coverage() {
	local out
	out=$(cd "$EVAL_DIR" && go test -count=1 -cover "./internal/transport/$1/" 2>&1)
	echo "$out" | tail -3
	grep -q 'coverage: 100\.0%' <<<"$out"
}

assert "task build green" run_task build
assert "task test green" run_task test

nested=()
while IFS= read -r pkg; do
	[ -n "$pkg" ] && nested+=("$pkg")
done < <(nested_packages)
assert_ge "a nested package exists below internal/transport" "${#nested[@]}" 1
for pkg in ${nested[@]+"${nested[@]}"}; do
	assert "nested package $pkg has its own test file" has_own_test "$pkg"
	assert "nested package $pkg is covered at 100.0%" full_coverage "$pkg"
done

assert_eq "expandEnv is no longer defined in webhook.go" "$(count_matches '^func expandEnv\(' "$IO_FILE")" 0
assert_eq "trimSlash is still defined in webhook.go" "$(count_matches '^func trimSlash\(' "$IO_FILE")" 1
assert_ge "webhook.go imports a nested package" "$(count_matches '"[^"]*/internal/transport/[a-z0-9_]+"' "$IO_FILE")" 1

# No door for tests: no export_test.go file anywhere in the tree.
assert_eq "no export_test.go in the tree" "$(cd "$EVAL_DIR" && find . -name 'export_test.go' -not -path './.git/*' | wc -l)" 0

assert_ge "at least one commit after the scaffold" "$(commits_since_base)" 1
assert "clean tree at the end" git -C "$EVAL_DIR" diff --quiet HEAD
finish
