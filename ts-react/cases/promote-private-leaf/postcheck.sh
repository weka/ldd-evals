#!/usr/bin/env bash
# promote-private-leaf postcheck: expandEnv left the I/O module for a new module
# with a public export, beside it or below it, with its own test file and full
# coverage of statements, functions and lines (not branches). trimSlash stayed, no
# test-only export exists, build and tests are green, the work is committed.
set -uo pipefail
here="$(dirname "$(readlink -f "$0")")"
for lib in "$here/../../postcheck/lib.sh" "$here/../postcheck/lib.sh"; do
  [ -f "$lib" ] && { . "$lib"; break; }
done

# ledger_user_rows — the number of ledger rows of the form "- finding · user · " for the
# current branch. The run has no user, so such a row is a false answer. A missing ledger
# file counts as zero rows.
ledger_user_rows() {
	local common branch file
	common=$(git -C "$EVAL_DIR" rev-parse --path-format=absolute --git-common-dir)
	branch=$(git -C "$EVAL_DIR" symbolic-ref --short -q HEAD) || branch=HEAD
	branch=${branch//\%/%25}
	file="$common/ldd/${branch//\//%2F}.md"
	[ -f "$file" ] || { echo 0; return; }
	grep -c '^- finding · user · ' "$file" || true
}

IO_FILE=src/services/transport/webhook.ts
TRANSPORT=src/services/transport

# new_files <ERE> — files added since the scaffold base (committed or untracked)
# under the transport folder whose path matches ERE.
new_files() {
	{
		git -C "$EVAL_DIR" diff --name-only --diff-filter=A "$(base_commit)" HEAD -- "$TRANSPORT"
		git -C "$EVAL_DIR" ls-files --others --exclude-standard -- "$TRANSPORT"
	} | sort -u | grep -E "$1" || true
}

# full_coverage — the new test files cover the new modules at 100 percent.
full_coverage() {
	local out rc=0 args=() f
	[ -n "$new_src" ] && [ -n "$new_tests" ] || return 1
	for f in $new_src; do args+=("--coverage.include=$f"); done
	out=$(cd "$EVAL_DIR" && CI=1 npx --no vitest run --coverage "${args[@]}" \
		--coverage.thresholds.lines=100 --coverage.thresholds.statements=100 \
		--coverage.thresholds.functions=100 $new_tests 2>&1) || rc=$?
	echo "$out" | tail -15
	return $rc
}

# exports_public_name — a new module exports a function or a constant.
exports_public_name() {
	local f
	for f in $new_src; do
		[ -f "$EVAL_DIR/$f" ] && grep -qE '^export (async )?(function|const)' "$EVAL_DIR/$f" && return 0
	done
	return 1
}

new_src=$(new_files '\.tsx?$' | grep -vE '\.test\.tsx?$')
new_tests=$(new_files '\.test\.tsx?$')

assert "task build green" run_task build
assert "task test green" run_task test

assert_ge "a new non-test module exists in the transport folder" "$(grep -c . <<<"$new_src")" 1
assert_ge "a new test file exists in the transport folder" "$(grep -c . <<<"$new_tests")" 1
assert "a new module exports a public name" exports_public_name
assert "the new modules are covered at 100 percent by the new tests" full_coverage

assert_eq "expandEnv is no longer defined in webhook.ts" "$(count_matches '^(export (const|function) |function )expandEnv\b' "$IO_FILE")" 0
assert_eq "trimSlash is still defined in webhook.ts" "$(count_matches '^(export )?function trimSlash\(' "$IO_FILE")" 1
assert_ge "webhook.ts imports a new module" "$(count_matches "^import .* from ['\"]\./[A-Za-z0-9_-]+(/[A-Za-z0-9_.-]+)?['\"]" "$IO_FILE")" 1

# No door for tests: no __testing hook and no test-only export.
assert_eq "no test-only export in the tree" "$(count_matches '__testing|ForTesting|exportedForTest' 'src/**/*.ts' 'src/**/*.tsx')" 0

assert_eq "the ledger has no finding row with a user answer" "$(ledger_user_rows)" 0
assert_ge "at least one commit after the scaffold" "$(commits_since_base)" 1
assert "clean tree at the end" git -C "$EVAL_DIR" diff --quiet HEAD
finish
