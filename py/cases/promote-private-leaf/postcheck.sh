#!/usr/bin/env bash
# promote-private-leaf postcheck: _expand_env left the I/O module for a new
# public module, beside it or below it, with its own test file and full
# coverage. _trim_slash stayed, no test-only export exists, build and tests are
# green, the work is committed.
set -uo pipefail
here="$(dirname "$(readlink -f "$0")")"
for lib in "$here/../../postcheck/lib.sh" "$here/../postcheck/lib.sh"; do
  [ -f "$lib" ] && { . "$lib"; break; }
done

# ledger_user_rows — the number of ledger rows of the form "- finding · user · " for the
# current branch. The run has no user, so such a row is a false answer. A missing ledger
# file counts as zero rows.
ledger_user_rows() {
	local branch file
	branch=$(git -C "$EVAL_DIR" symbolic-ref --short -q HEAD) || branch=detached
	file=$(git -C "$EVAL_DIR" rev-parse --git-path "ldd/${branch//\//%2F}.md")
	case "$file" in /*) ;; *) file="$EVAL_DIR/$file" ;; esac
	[ -f "$file" ] || { echo 0; return; }
	grep -c '^- finding · user · ' "$file" || true
}

IO_FILE=internal/transport/webhook.py
TRANSPORT=internal/transport

# new_files <ERE> — files added since the scaffold base (committed or untracked)
# under the transport package whose path matches ERE.
new_files() {
	{
		git -C "$EVAL_DIR" diff --name-only --diff-filter=A "$(base_commit)" HEAD -- "$TRANSPORT"
		git -C "$EVAL_DIR" ls-files --others --exclude-standard -- "$TRANSPORT"
	} | sort -u | grep -E "$1" || true
}

# module_name <path> — the dotted import name of a Python file.
module_name() {
	local m=${1%.py}
	m=${m%/__init__}
	echo "${m//\//.}"
}

# full_coverage — the new test files cover the new modules at 100 percent.
# pytest-cov runs through uvx, so the fixture needs no new dependency.
full_coverage() {
	local out rc=0 args=() f
	[ -n "$new_src" ] && [ -n "$new_tests" ] || return 1
	for f in $new_src; do args+=("--cov=$(module_name "$f")"); done
	out=$(cd "$EVAL_DIR" && uvx -q --from pytest --with pytest-cov pytest -q -p no:cacheprovider \
		"${args[@]}" --cov-fail-under=100 $new_tests 2>&1) || rc=$?
	echo "$out" | tail -15
	return $rc
}

# exports_public_name — a new module defines a function whose name has no leading underscore.
exports_public_name() {
	local f
	for f in $new_src; do
		[ -f "$EVAL_DIR/$f" ] && grep -qE '^def [A-Za-z]' "$EVAL_DIR/$f" && return 0
	done
	return 1
}

new_src=$(new_files '\.py$' | grep -vE '(^|/)test_[^/]*\.py$|/__pycache__/')
new_tests=$(new_files '(^|/)test_[^/]*\.py$')

assert "task build green" run_task build
assert "task test green" run_task test

assert_ge "a new non-test module exists in the transport package" "$(grep -c . <<<"$new_src")" 1
assert_ge "a new test file exists in the transport package" "$(grep -c . <<<"$new_tests")" 1
assert "a new module exports a public function" exports_public_name
assert "the new modules are covered at 100 percent by the new tests" full_coverage

assert_eq "_expand_env is no longer defined in webhook.py" "$(count_matches '^def _?expand_env\(' "$IO_FILE")" 0
assert_eq "_trim_slash is still defined in webhook.py" "$(count_matches '^def _trim_slash\(' "$IO_FILE")" 1
assert_ge "webhook.py imports a new module" "$(count_matches '^(from|import) +(\.|internal\.transport)([a-z0-9_.]*)( +import|$)' "$IO_FILE")" 1

# No door for tests: no __testing hook and no test-only export module.
assert_eq "no test-only export in the tree" "$(count_matches '__testing|testing_exports' 'internal/**/*.py' 'svc/**/*.py')" 0

assert_eq "the ledger has no finding row with a user answer" "$(ledger_user_rows)" 0
assert_ge "at least one commit after the scaffold" "$(commits_since_base)" 1
assert "clean tree at the end" git -C "$EVAL_DIR" diff --quiet HEAD
finish
