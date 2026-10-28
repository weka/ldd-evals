#!/usr/bin/env bash
# postcheck/lib.sh — shared helpers for the cases' postcheck.sh scripts.
#
# Source it from a case's postcheck.sh:
#   . "$(dirname "$(readlink -f "$0")")/../postcheck/lib.sh"
#
# The runner executes postcheck.sh with cwd=$EVAL_DIR (the kept scaffold dir)
# and EVAL_OUT (the run's output dir). Every helper here works in $EVAL_DIR.
# Helpers print what they measured; `assert*` record failures and `finish`
# turns them into the exit code. Append-only: other stages add functions below
# their own marker, never rewrite existing ones.
#
# This is go/postcheck/lib.sh with the same helper names on Python tools: the
# complexity helpers keep their Go names (gocognit_of, gocyclo_of) so a case's
# postcheck reads the same in both suites; "production" means every *.py that
# is not a test_*.py; the black-box suite is pytest; lint is ruff plus mypy.

: "${EVAL_DIR:=$PWD}"
: "${EVAL_OUT:=/tmp}"
export PATH="$PATH:/root/.local/bin:$HOME/.local/bin"

LDD_POSTCHECK_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export LDD_POSTCHECK_DIR

# Pinned complexity tools. Both run through `uvx --from pkg==version`, which
# ignores the fixture's pyproject, and both read the AST, so they IGNORE
# `# noqa` directives — unlike ruff, which would hide the planted functions
# behind their suppressions. complexipy measures cognitive complexity (the
# gocognit twin), radon cyclomatic complexity (the gocyclo twin).
COMPLEXIPY_PKG="complexipy==8.0.1"
RADON_PKG="radon==6.0.1"

_pc_failures=0

# ── assertions ───────────────────────────────────────────────────────────────

# assert <description> <command...>   — PASS/FAIL by the command's exit code.
assert() {
	local desc=$1
	shift
	if "$@"; then
		echo "PASS  $desc"
	else
		echo "FAIL  $desc"
		_pc_failures=$((_pc_failures + 1))
	fi
}

# assert_le <description> <actual> <max>
assert_le() {
	local desc=$1 actual=${2:-} max=$3
	actual=${actual//[[:space:]]/} # BSD wc pads its counts with spaces
	if [[ "$actual" =~ ^-?[0-9]+$ ]] && ((actual <= max)); then
		echo "PASS  $desc ($actual <= $max)"
	else
		echo "FAIL  $desc (got '${actual:-<none>}', want <= $max)"
		_pc_failures=$((_pc_failures + 1))
	fi
}

# assert_ge <description> <actual> <min>
assert_ge() {
	local desc=$1 actual=${2:-} min=$3
	actual=${actual//[[:space:]]/} # BSD wc pads its counts with spaces
	if [[ "$actual" =~ ^-?[0-9]+$ ]] && ((actual >= min)); then
		echo "PASS  $desc ($actual >= $min)"
	else
		echo "FAIL  $desc (got '${actual:-<none>}', want >= $min)"
		_pc_failures=$((_pc_failures + 1))
	fi
}

# assert_eq <description> <actual> <expected>
assert_eq() {
	local desc=$1 actual=${2:-} expected=$3
	actual=${actual//[[:space:]]/} # BSD wc pads its counts with spaces
	if [[ "$actual" == "$expected" ]]; then
		echo "PASS  $desc ($actual)"
	else
		echo "FAIL  $desc (got '${actual:-<none>}', want '$expected')"
		_pc_failures=$((_pc_failures + 1))
	fi
}

# finish — exit 1 when any assertion failed, 0 otherwise. Call it last.
finish() {
	if ((_pc_failures > 0)); then
		echo "postcheck: $_pc_failures check(s) failed"
		exit 1
	fi
	echo "postcheck: all checks passed"
	exit 0
}

# ── build / test / lint ──────────────────────────────────────────────────────

# run_task <name> — runs `task <name>` in $EVAL_DIR, prints the tail of its
# output, returns its exit code.
run_task() {
	local name=$1 out rc=0
	out=$(cd "$EVAL_DIR" && task "$name" 2>&1) || rc=$?
	if ((rc != 0)); then
		echo "task $name: exit $rc"
		echo "$out" | tail -40
	else
		echo "task $name: ok"
	fi
	return $rc
}

# ── complexity ───────────────────────────────────────────────────────────────

# _is_prod_py <path> — true for a production module (a *.py whose base name
# is not test_*.py).
_is_prod_py() {
	[[ "$1" == *.py && "$(basename "$1")" != test_*.py ]]
}

# gocognit_of <func> [path] — cognitive complexity of one function, the
# highest complexipy reports for a function or method named <func>
# (`Class::method` matches on the bare method name) under <path> (default: the
# whole tree). Returns 1 and prints nothing when no such function exists.
gocognit_of() {
	local fn=$1 path=${2:-.} out
	out=$(mktemp)
	(cd "$EVAL_DIR" && uvx -q --from "$COMPLEXIPY_PKG" complexipy "$path" -q --output-format json --output "$out" >/dev/null 2>&1) || true
	jq -r --arg fn "$fn" '
		[ .[] | select((.function_name | split("::") | last) == $fn) | .complexity ] | max // empty
	' "$out" 2>/dev/null | awk 'NF { print; found = 1 } END { if (!found) exit 1 }'
	local rc=$?
	rm -f "$out"
	return $rc
}

# gocyclo_of <func> [path] — cyclomatic complexity of one function, the
# highest radon reports for a function or method named <func> under <path>.
gocyclo_of() {
	local fn=$1 path=${2:-.}
	(cd "$EVAL_DIR" && uvx -q --from "$RADON_PKG" radon cc -j "$path" 2>/dev/null) |
		jq -r --arg fn "$fn" '
			[ .[] | .[] | (select(.type != "class") , (select(.type == "class") | .methods[]?))
			  | select(.name == $fn) | .complexity ] | max // empty
		' | awk 'NF { print; found = 1 } END { if (!found) exit 1 }'
}

# ── greps over the working tree ──────────────────────────────────────────────

# count_matches <ERE> <path-glob>... — number of lines matching ERE across the
# files the globs select (relative to $EVAL_DIR; `**` recurses). Missing globs
# count as 0.
count_matches() {
	local ere=$1
	shift
	(
		cd "$EVAL_DIR" || exit 1
		shopt -s nullglob globstar
		local files=() g f
		for g in "$@"; do
			for f in $g; do [[ -f "$f" ]] && files+=("$f"); done
		done
		((${#files[@]} == 0)) && { echo 0; exit 0; }
		grep -hE -- "$ere" "${files[@]}" | wc -l | tr -d ' '
	)
}

# count_matches_prod <ERE> <path-glob>... — count_matches restricted to
# production files (every test_*.py the globs select is skipped).
count_matches_prod() {
	local ere=$1
	shift
	(
		cd "$EVAL_DIR" || exit 1
		shopt -s nullglob globstar
		local files=() g f
		for g in "$@"; do
			for f in $g; do [[ -f "$f" && "$(basename "$f")" != test_*.py ]] && files+=("$f"); done
		done
		((${#files[@]} == 0)) && { echo 0; exit 0; }
		grep -hE -- "$ere" "${files[@]}" | wc -l | tr -d ' '
	)
}

# count_matches_at <rev> <ERE> <pathspec>... — like count_matches but over a
# git revision, using git pathspecs (e.g. '*.py' ':(exclude)svc/').
count_matches_at() {
	local rev=$1 ere=$2
	shift 2
	git -C "$EVAL_DIR" grep -E -c -e "$ere" "$rev" -- "$@" 2>/dev/null |
		awk -F: '{ s += $NF } END { print s + 0 }'
}

# func_body <name> <file> — prints the source of the function or method
# <name> in <file>: its `def` line (decorators excluded) and every following
# line indented deeper than the def, blank lines included, up to the first
# line at the def's indentation or shallower.
func_body() {
	local name=$1 file=$2
	awk -v name="$name" '
		function indent(s) { match(s, /^[ \t]*/); return RLENGTH }
		!p && $0 ~ ("^[ \t]*(async )?def " name "\\(") { p = 1; base = indent($0); print; next }
		p && $0 ~ /^[ \t]*$/ { buf = buf $0 "\n"; next }
		p && indent($0) <= base { exit }
		p { printf "%s", buf; buf = ""; print }' "$EVAL_DIR/$file"
}

# receiver_calls_in <name> <file> — names of the receiver methods `self.X(`
# a method calls in its body.
receiver_calls_in() {
	local name=$1 file=$2 body
	body=$(func_body "$name" "$file")
	[[ -z "$body" ]] && return 1
	tail -n +2 <<<"$body" | grep -oE "\bself\.[A-Za-z_][A-Za-z0-9_]*\(" |
		sed -E 's/^self\.//; s/\($//' | sort -u
}

# new_func_names <ERE> <path-glob>... — names of functions whose `def` line
# matches ERE in the working tree but did not exist at the scaffold base
# commit (so a pre-existing constructor cannot satisfy a "new type" check).
new_func_names() {
	local ere=$1
	shift
	(
		cd "$EVAL_DIR" || exit 1
		shopt -s nullglob globstar
		local files=() g f
		for g in "$@"; do
			for f in $g; do [[ -f "$f" ]] && files+=("$f"); done
		done
		((${#files[@]} == 0)) && exit 0
		comm -13 \
			<(git grep -hoE -e "$ere" "$(base_commit)" -- "${files[@]}" "$@" 2>/dev/null | sed -E 's/^[ \t]*(async )?def //; s/\(.*$//' | sort -u) \
			<(grep -hoE -- "$ere" "${files[@]}" | sed -E 's/^[ \t]*(async )?def //; s/\(.*$//' | sort -u)
	)
}

# external_test_calls <ERE> <path-glob>... — matching lines in test_*.py files
# that import no private name (rung-0 tests through the public API; Go's
# `package x_test` twin).
external_test_calls() {
	local ere=$1
	shift
	(
		cd "$EVAL_DIR" || exit 1
		shopt -s nullglob globstar
		local total=0 g f n
		for g in "$@"; do
			for f in $g; do
				[[ -f "$f" && "$(basename "$f")" == test_*.py ]] || continue
				grep -qE '^from [A-Za-z0-9_.]+ import .*\b_[a-z]|^import [A-Za-z0-9_.]*\._[a-z]' "$f" && continue
				n=$(grep -cE -- "$ere" "$f" || true)
				total=$((total + n))
			done
		done
		echo "$total"
	)
}

# ── git history ──────────────────────────────────────────────────────────────

# base_commit — the scaffold's first (root) commit.
base_commit() {
	git -C "$EVAL_DIR" rev-list --max-parents=0 HEAD | tail -1
}

# commits_since_base — how many commits the agent added on top of the scaffold.
commits_since_base() {
	git -C "$EVAL_DIR" rev-list --count HEAD "^$(base_commit)"
}

# ratchet_nonincreasing <ERE> <pathspec>... — walks the commits oldest→newest
# and asserts the number of matching lines never rises and ends at 0. Prints
# one line per commit. Returns 1 on any violation.
ratchet_nonincreasing() {
	local ere=$1
	shift
	local prev=-1 c cnt bad=0
	for c in $(git -C "$EVAL_DIR" rev-list --reverse HEAD); do
		cnt=$(count_matches_at "$c" "$ere" "$@")
		printf '  %s  %3d  %s\n' "$(git -C "$EVAL_DIR" rev-parse --short "$c")" "$cnt" \
			"$(git -C "$EVAL_DIR" log -1 --format=%s "$c")"
		if ((prev >= 0 && cnt > prev)); then
			echo "  ratchet: count rose from $prev to $cnt"
			bad=1
		fi
		prev=$cnt
	done
	if ((prev != 0)); then
		echo "  ratchet: final count is $prev, want 0"
		bad=1
	fi
	return $bad
}

# _changes_code <commit> <file> — true when <commit>'s diff of <file> adds or
# removes at least one line that is neither blank nor a comment line. A commit
# that only rewrites comments (a comment-critic fixup across the tree) is not a
# code change in the packages it wrote in.
_changes_code() {
	git -C "$EVAL_DIR" diff-tree --no-commit-id -r -p -U0 "$1" -- "$2" |
		grep -E '^[+-]' | grep -vE '^(\+\+\+|---) ' |
		sed -E 's/^[+-][[:space:]]*//' |
		grep -qvE '^$|^#'
}

# pkgs_touched_per_commit — one line per commit after the base, oldest first:
# short hash, the number of distinct package directories whose production
# modules that commit changed in code (comment-only and blank-line edits do not
# count), and the subject.
pkgs_touched_per_commit() {
	local c n f
	for c in $(git -C "$EVAL_DIR" rev-list --reverse HEAD "^$(base_commit)"); do
		n=$(git -C "$EVAL_DIR" diff-tree --no-commit-id --name-only -r "$c" |
			grep -E '\.py$' | grep -vE '(^|/)test_[^/]*\.py$' |
			while IFS= read -r f; do _changes_code "$c" "$f" && dirname "$f"; done |
			sort -u | wc -l | tr -d ' ')
		printf '  %s  %3d  %s\n' "$(git -C "$EVAL_DIR" rev-parse --short "$c")" "$n" \
			"$(git -C "$EVAL_DIR" log -1 --format=%s "$c")"
	done
}

# max_pkgs_touched_per_commit — the largest package count pkgs_touched_per_commit
# prints (0 when there are no commits).
max_pkgs_touched_per_commit() {
	pkgs_touched_per_commit | awk 'BEGIN { m = 0 } { if ($2 + 0 > m) m = $2 + 0 } END { print m }'
}

# ── the hidden top rung ──────────────────────────────────────────────────────

# run_blackbox — runs the heartbeat black-box suite against $EVAL_DIR. Prints
# its full output on failure (it is the loudest signal a refactor case has).
run_blackbox() {
	local dir="$LDD_POSTCHECK_DIR/heartbeat-blackbox" out rc=0
	echo "== black-box suite: starts python -m svc from the tree, replays the recorded heartbeats =="
	out=$(cd "$dir" && EVAL_DIR="$EVAL_DIR" pytest -q -rA -p no:cacheprovider test_blackbox.py 2>&1) || rc=$?
	if ((rc != 0)); then
		echo "$out"
		echo "black-box: FAIL (exit $rc) — the HTTP behavior of POST /heartbeat changed"
		return 1
	fi
	if grep -qE 'SKIPPED' <<<"$out"; then
		echo "$out"
		echo "black-box: the suite skipped — EVAL_DIR was not honoured"
		return 1
	fi
	grep -E '^(PASSED|[0-9]+ passed)' <<<"$out"
	echo "black-box: PASS"
}

# ── stage 4a: workflow cases (quickfix / prepare / wire-repo-brain) ──────────

# lint_issue_count — number of issues `ruff check` and `mypy` report on the
# tree together (0 when green). Informational for the quickfix case:
# escalations may legitimately still be pending when the run ends.
lint_issue_count() {
	local ruff_n mypy_n
	ruff_n=$( (cd "$EVAL_DIR" && ruff check --output-format json . 2>/dev/null || true) | jq 'length' 2>/dev/null)
	mypy_n=$( (cd "$EVAL_DIR" && mypy 2>/dev/null || true) | grep -cE ': error:' || true)
	echo $(( ${ruff_n:-0} + ${mypy_n:-0} ))
}

# count_assertions <test-file> — assertion lines in one file: bare asserts,
# pytest.raises blocks and pytest.fail calls.
count_assertions() {
	grep -cE '^\s*(assert\b|with pytest\.raises\(|pytest\.fail\()' "$EVAL_DIR/$1" 2>/dev/null || true
}

# total_assertions — assertion lines across every test_*.py in the tree.
total_assertions() {
	(cd "$EVAL_DIR" && grep -rcE '^\s*(assert\b|with pytest\.raises\(|pytest\.fail\()' --include='test_*.py' . 2>/dev/null | awk -F: '{s+=$NF} END {print s+0}')
}

# assert_assertions_kept <baseline-file> — every test_*.py listed in the
# baseline (`<count> <path>` per line, paths relative to the repo root) still
# exists and carries at least as many assertion lines as it did (the
# lint-fixer's "never weaken a test" hard limit). One assert per file. A file
# that no longer exists is a legitimate move when its package was dissolved
# (an R4 fix), so it passes only if the tree as a whole still carries at least
# the baseline's total assertion lines; otherwise assertions were lost.
assert_assertions_kept() {
	local want path baseline_total
	baseline_total=$(awk '{s+=$1} END {print s+0}' "$1")
	while read -r want path; do
		[[ -z "$path" ]] && continue
		if [[ ! -f "$EVAL_DIR/$path" ]]; then
			assert_ge "test file $path removed (had $want assertion lines): tree total still covers the baseline $baseline_total" "$(total_assertions)" "$baseline_total"
			continue
		fi
		assert_ge "assertions kept in $path" "$(count_assertions "$path")" "$want"
	done <"$1"
}

# file_unchanged_since_base <path> — true when the working-tree file is
# byte-identical to the scaffold's commit (uncommitted edits count as changes).
file_unchanged_since_base() {
	git -C "$EVAL_DIR" diff --quiet "$(base_commit)" -- "$1"
}

# last_message_contains <ERE> — greps the run's final agent message, taken from
# the result event in $EVAL_OUT/trace.jsonl (result.json is written after the
# graders run, so the trace is the only artifact a postcheck can read).
last_message_contains() {
	[[ -f "$EVAL_OUT/trace.jsonl" ]] || return 1
	grep '"type":"result"' "$EVAL_OUT/trace.jsonl" | grep -qE -- "$1"
}
