#!/usr/bin/env bash
# promote-private-leaf postcheck: _expand_env left the I/O module for a nested
# package that has its own tests and full coverage, _trim_slash stayed, no
# test-only export exists, build and tests are green, the work is committed.
set -uo pipefail
here="$(dirname "$(readlink -f "$0")")"
for lib in "$here/../../postcheck/lib.sh" "$here/../postcheck/lib.sh"; do
  [ -f "$lib" ] && { . "$lib"; break; }
done

IO_FILE=internal/transport/webhook.py

# nested_packages — directories one level below internal/transport that hold a
# non-test Python module.
nested_packages() {
	local d
	for d in "$EVAL_DIR"/internal/transport/*/; do
		[ -d "$d" ] || continue
		case "$(basename "$d")" in __pycache__ | .*) continue ;; esac
		find "$d" -maxdepth 1 -name '*.py' ! -name 'test_*' 2>/dev/null | grep -q . && basename "$d"
	done
}

# has_own_test <dir> — the directory holds at least one test_*.py file.
has_own_test() {
	ls "$EVAL_DIR/internal/transport/$1/"test_*.py >/dev/null 2>&1
}

# full_coverage <dir> — the nested package's own tests cover it at 100 percent.
# pytest-cov runs through uvx, so the fixture needs no new dependency.
full_coverage() {
	local out rc=0
	out=$(cd "$EVAL_DIR" && uvx -q --from pytest --with pytest-cov pytest -q -p no:cacheprovider \
		"--cov=internal/transport/$1" --cov-fail-under=100 "internal/transport/$1" 2>&1) || rc=$?
	echo "$out" | tail -15
	return $rc
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
	assert "nested package $pkg is covered at 100 percent" full_coverage "$pkg"
done

assert_eq "_expand_env is no longer defined in webhook.py" "$(count_matches '^def _?expand_env\(' "$IO_FILE")" 0
assert_eq "_trim_slash is still defined in webhook.py" "$(count_matches '^def _trim_slash\(' "$IO_FILE")" 1
assert_ge "webhook.py imports a nested package" "$(count_matches '^(from|import) +(\.|internal\.transport\.)[a-z0-9_]+' "$IO_FILE")" 1

# No door for tests: no __testing hook and no test-only export module.
assert_eq "no test-only export in the tree" "$(count_matches '__testing|testing_exports' 'internal/**/*.py' 'svc/**/*.py')" 0

assert_ge "at least one commit after the scaffold" "$(commits_since_base)" 1
assert "clean tree at the end" git -C "$EVAL_DIR" diff --quiet HEAD
finish
