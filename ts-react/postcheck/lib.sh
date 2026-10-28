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
# This is py/postcheck/lib.sh with the same helper names on the TypeScript
# tools: the complexity helpers keep their Go names (gocognit_of, gocyclo_of)
# so a case's postcheck reads the same in every suite, and both run ESLint with
# `--no-inline-config` so a suppression cannot hide a planted function;
# "production" means every *.ts / *.tsx under src/ that is not a *.test.* file
# and not under src/test-utils/; the black-box suite is a Vitest file dropped
# into the tree; lint is tsc plus ESLint plus Prettier, through `task lint`.

: "${EVAL_DIR:=$PWD}"
: "${EVAL_OUT:=/tmp}"
export PATH="$PATH:/root/.local/bin:$HOME/.local/bin:/root/go/bin"

LDD_POSTCHECK_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export LDD_POSTCHECK_DIR

# Suppression directives, the twin of `# noqa` / `# type: ignore`: ESLint's
# three disable forms plus the file-level configuration comment
# (`/* eslint <rule>: "off" */`, the only in-file silence for a rule such as
# sonarjs/max-lines that reports at line 0) and tsc's three. One ERE for every
# grep over the tree.
SUPPRESSION_RE='eslint-disable|/\* eslint |@ts-(expect-error|ignore|nocheck)'

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

# _eslint — the fixture's own ESLint binary, so the measuring runs see the
# plugins the fixture configures; npx is the fallback when node_modules moved.
_eslint() {
	if [[ -x "$EVAL_DIR/node_modules/.bin/eslint" ]]; then
		(cd "$EVAL_DIR" && ./node_modules/.bin/eslint "$@")
	else
		(cd "$EVAL_DIR" && npx --no eslint "$@")
	fi
}

# ── complexity ───────────────────────────────────────────────────────────────

# _is_prod_ts <path> — true for a production module: a *.ts or *.tsx that is
# not a test file, not test infrastructure, not a dependency and not the
# black-box suite.
_is_prod_ts() {
	local p=$1 b
	b=$(basename "$p")
	[[ "$p" == *.ts || "$p" == *.tsx ]] || return 1
	[[ "$b" != *.test.* && "$b" != *.spec.* ]] || return 1
	[[ "$p" != */test-utils/* && "$p" != */node_modules/* && "$p" != */__blackbox__/* ]]
}

# _complexity_of <func> <path> <cognitive|cyclomatic> — the shared body of
# gocognit_of and gocyclo_of: ESLint over <path> with the measuring rule at
# threshold 0 and inline config off (a `// eslint-disable-next-line` on the
# planted function must not hide it), the JSON report handed to
# complexity-of.mjs, which attributes each message to its function by name.
_complexity_of() {
	local fn=$1 path=$2 kind=$3 rule out rc
	case "$kind" in
	cognitive) rule='{"sonarjs/cognitive-complexity":["error",0]}' ;;
	*) rule='{"complexity":["error",0]}' ;;
	esac
	out=$(mktemp)
	# ESLint exits 1 whenever the threshold-0 rule fires, which is every time.
	_eslint --no-inline-config --no-error-on-unmatched-pattern --format json --rule "$rule" \
		"$path" >"$out" 2>/dev/null || true
	node "$LDD_POSTCHECK_DIR/complexity-of.mjs" "$out" "$fn" "$kind"
	rc=$?
	rm -f "$out"
	return $rc
}

# gocognit_of <func> [path] — cognitive complexity of one function, the
# highest ESLint (sonarjs/cognitive-complexity) reports for a function or
# method named <func> under <path> (default: src). Returns 1 and prints
# nothing when no such function exists.
gocognit_of() {
	_complexity_of "$1" "${2:-src}" cognitive
}

# gocyclo_of <func> [path] — cyclomatic complexity of one function, the
# highest ESLint's core `complexity` rule reports for a function or method
# named <func> under <path>.
gocyclo_of() {
	_complexity_of "$1" "${2:-src}" cyclomatic
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
			for f in $g; do [[ -f "$f" && "$f" != */node_modules/* ]] && files+=("$f"); done
		done
		((${#files[@]} == 0)) && { echo 0; exit 0; }
		grep -hE -- "$ere" "${files[@]}" | wc -l | tr -d ' '
	)
}

# count_matches_prod <ERE> <path-glob>... — count_matches restricted to
# production files (every *.test.*, *.spec.*, test-utils/ and node_modules/
# file the globs select is skipped).
count_matches_prod() {
	local ere=$1
	shift
	(
		cd "$EVAL_DIR" || exit 1
		shopt -s nullglob globstar
		local files=() g f
		for g in "$@"; do
			for f in $g; do [[ -f "$f" ]] && _is_prod_ts "$f" && files+=("$f"); done
		done
		((${#files[@]} == 0)) && { echo 0; exit 0; }
		grep -hE -- "$ere" "${files[@]}" | wc -l | tr -d ' '
	)
}

# count_matches_at <rev> <ERE> <pathspec>... — like count_matches but over a
# git revision, using git pathspecs (e.g. 'src/*.ts' ':(exclude)src/main.tsx').
count_matches_at() {
	local rev=$1 ere=$2
	shift 2
	git -C "$EVAL_DIR" grep -E -c -e "$ere" "$rev" -- "$@" 2>/dev/null |
		awk -F: '{ s += $NF } END { print s + 0 }'
}

# count_suppressions <path-glob>... — lines carrying an ESLint or tsc
# suppression directive in the files the globs select.
count_suppressions() {
	count_matches "$SUPPRESSION_RE" "$@"
}

# func_body <name> <file> — prints the source of the function, method or
# arrow function <name> in <file>: from its declaration line to the line that
# closes its body, by brace depth (braces inside strings and comments are
# counted too, which is close enough for the fixture's code).
func_body() {
	local name=$1 file=$2
	awk -v name="$name" '
		function depth_delta(s,   n, i, c) {
			n = 0
			for (i = 1; i <= length(s); i++) {
				c = substr(s, i, 1)
				if (c == "{") n++
				else if (c == "}") n--
			}
			return n
		}
		!p && ($0 ~ ("(^|[^A-Za-z0-9_$])function[ \t]*\\*?[ \t]*" name "[ \t]*[<(]") ||
		       $0 ~ ("(^|[^A-Za-z0-9_$])(const|let|var)[ \t]+" name "[ \t]*(:[^=]*)?=") ||
		       $0 ~ ("^[ \t]*((public|private|protected|static|readonly|async|override|get|set)[ \t]+)*" name "[ \t]*(<[^>]*>)?\\(")) {
			p = 1; d = 0
		}
		p {
			print
			d += depth_delta($0)
			if (opened && d <= 0) exit
			if (d > 0) opened = 1
		}' "$EVAL_DIR/$file"
}

# callees_in <name> <file> — names of the functions and methods the body of
# <name> calls: `this.x(` as x, bare `helper(` as helper; keywords, the
# function itself and member calls on other objects are left out. The twin of
# py's receiver_calls_in; a free function's helpers count too, because a
# TypeScript module's helpers are rarely methods.
callees_in() {
	local name=$1 file=$2 body
	body=$(func_body "$name" "$file")
	[[ -z "$body" ]] && return 1
	tail -n +2 <<<"$body" |
		grep -oE "(^|[^A-Za-z0-9_$.])(this\.)?[A-Za-z_$][A-Za-z0-9_$]*\(" |
		sed -E 's/^[^A-Za-z_$]*//; s/^this\.//; s/\($//' |
		grep -vxE "if|for|while|switch|catch|return|typeof|function|await|new|throw|$name" |
		sort -u
}
receiver_calls_in() { callees_in "$@"; }

# new_type_names <path-glob>... — names of exported classes, interfaces,
# type aliases and enums declared in the working tree but not at the scaffold
# base commit (so a pre-existing type cannot satisfy a "new type" check).
new_type_names() {
	(
		cd "$EVAL_DIR" || exit 1
		shopt -s nullglob globstar
		local files=() g f
		for g in "$@"; do
			for f in $g; do [[ -f "$f" ]] && _is_prod_ts "$f" && files+=("$f"); done
		done
		((${#files[@]} == 0)) && exit 0
		local ere='^export (declare )?(abstract )?(class|interface|type|enum|const enum) [A-Z][A-Za-z0-9_]*'
		comm -13 \
			<(git grep -hoE -e "$ere" "$(base_commit)" -- "$@" 2>/dev/null | sed -E 's/^export (declare )?(abstract )?(class|interface|type|enum|const enum) //' | sort -u) \
			<(grep -hoE -- "$ere" "${files[@]}" | sed -E 's/^export (declare )?(abstract )?(class|interface|type|enum|const enum) //' | sort -u)
	)
}

# external_test_calls <ERE> <path-glob>... — matching lines in *.test.ts(x)
# files that reach nothing private: no `vi.mock(` of a sibling module and no
# `vi.spyOn(` on a module namespace (rung-0 tests through the public API; Go's
# `package x_test` twin, py's "imports no private name").
external_test_calls() {
	local ere=$1
	shift
	(
		cd "$EVAL_DIR" || exit 1
		shopt -s nullglob globstar
		local total=0 g f n b
		for g in "$@"; do
			for f in $g; do
				b=$(basename "$f")
				[[ -f "$f" && ("$b" == *.test.ts || "$b" == *.test.tsx) ]] || continue
				grep -qE "vi\.mock\(['\"]\.|vi\.spyOn\([A-Za-z_]+, ['\"]" "$f" && continue
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
# removes at least one line that is neither blank nor a comment line (`//`,
# `/*`, `*`). A commit that only rewrites comments (a comment-critic fixup
# across the tree) is not a code change in the directories it wrote in.
_changes_code() {
	git -C "$EVAL_DIR" diff-tree --no-commit-id -r -p -U0 "$1" -- "$2" |
		grep -E '^[+-]' | grep -vE '^(\+\+\+|---) ' |
		sed -E 's/^[+-][[:space:]]*//' |
		grep -qvE '^$|^//|^/\*|^\*'
}

# pkgs_touched_per_commit — one line per commit after the base, oldest first:
# short hash, the number of distinct directories whose production modules
# that commit changed in code (comment-only and blank-line edits do not
# count), and the subject. A directory is TypeScript's package.
pkgs_touched_per_commit() {
	local c n f
	for c in $(git -C "$EVAL_DIR" rev-list --reverse HEAD "^$(base_commit)"); do
		n=$(git -C "$EVAL_DIR" diff-tree --no-commit-id --name-only -r "$c" |
			while IFS= read -r f; do _is_prod_ts "$f" && _changes_code "$c" "$f" && dirname "$f"; done |
			sort -u | wc -l | tr -d ' ')
		printf '  %s  %3d  %s\n' "$(git -C "$EVAL_DIR" rev-parse --short "$c")" "$n" \
			"$(git -C "$EVAL_DIR" log -1 --format=%s "$c")"
	done
}

# max_pkgs_touched_per_commit — the largest directory count
# pkgs_touched_per_commit prints (0 when there are no commits).
max_pkgs_touched_per_commit() {
	pkgs_touched_per_commit | awk 'BEGIN { m = 0 } { if ($2 + 0 > m) m = $2 + 0 } END { print m }'
}

# ── the hidden top rung ──────────────────────────────────────────────────────

# run_blackbox — runs the heartbeat black-box suite against $EVAL_DIR: copies
# blackbox.test.tsx and expected.tsv into src/__blackbox__/, runs Vitest on
# that directory alone, removes the directory again, and returns Vitest's exit
# code. Prints the full output on failure (it is the loudest signal a
# refactor case has).
run_blackbox() {
	local dir="$LDD_POSTCHECK_DIR/heartbeat-blackbox" dest="$EVAL_DIR/src/__blackbox__" out rc=0
	echo "== black-box suite: renders the app at /heartbeats from the tree, replays the recorded heartbeats =="
	if [[ ! -f "$dir/blackbox.test.tsx" || ! -f "$dir/expected.tsv" ]]; then
		echo "black-box: suite not present at $dir"
		return 1
	fi
	rm -rf "$dest"
	mkdir -p "$dest"
	cp "$dir/blackbox.test.tsx" "$dir/expected.tsv" "$dest/"
	out=$(cd "$EVAL_DIR" && CI=1 npx --no vitest run src/__blackbox__ --reporter=dot 2>&1) || rc=$?
	rm -rf "$dest"
	if ((rc != 0)); then
		echo "$out"
		echo "black-box: FAIL (exit $rc) — the behavior of the heartbeat simulator changed"
		return 1
	fi
	if grep -qiE 'no test files found|skipped' <<<"$out"; then
		echo "$out"
		echo "black-box: the suite did not run"
		return 1
	fi
	grep -E 'Tests? +[0-9]+ passed|Test Files' <<<"$out" || true
	echo "black-box: PASS"
}

# ── stage 4a: workflow cases (quickfix / prepare / wire-repo-brain) ──────────

# lint_issue_count — number of issues ESLint (errors + warnings) and tsc report
# on the tree together (0 when green). Informational for the quickfix case:
# escalations may legitimately still be pending when the run ends.
lint_issue_count() {
	local eslint_n tsc_n
	eslint_n=$(_eslint --format json . 2>/dev/null | jq '[.[] | .errorCount + .warningCount] | add // 0' 2>/dev/null)
	tsc_n=$( (cd "$EVAL_DIR" && npx --no tsc -b --pretty false 2>/dev/null || true) | grep -cE 'error TS[0-9]+' || true)
	echo $(( ${eslint_n:-0} + ${tsc_n:-0} ))
}

# Assertion lines in a Vitest file: `expect(...)`, `expect.soft(...)`, and the
# explicit failures `expect.fail(` / `assert.fail(`. `expect(() => …).toThrow()`
# is the `pytest.raises` twin and starts with expect like every other line.
ASSERTION_RE='^\s*(await\s+)?expect(\.soft)?\(|^\s*(expect|assert)\.fail\('

# count_assertions <test-file> — assertion lines in one file.
count_assertions() {
	grep -cE "$ASSERTION_RE" "$EVAL_DIR/$1" 2>/dev/null || true
}

# total_assertions — assertion lines across every *.test.ts(x) in the tree.
total_assertions() {
	(cd "$EVAL_DIR" && grep -rcE "$ASSERTION_RE" --include='*.test.ts' --include='*.test.tsx' --exclude-dir=node_modules --exclude-dir=.git . 2>/dev/null | awk -F: '{s+=$NF} END {print s+0}')
}

# assert_assertions_kept <baseline-file> — every test file listed in the
# baseline (`<count> <path>` per line, paths relative to the repo root) still
# exists and carries at least as many assertion lines as it did (the
# lint-fixer's "never weaken a test" hard limit). One assert per file. A file
# that no longer exists is a legitimate move when its module was dissolved
# (an R4 or R5 fix), so it passes only if the tree as a whole still carries at
# least the baseline's total assertion lines; otherwise assertions were lost.
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

# assert_lint_config_unchanged — the ESLint config in the tree is
# byte-identical to the fixture's original kept beside this file (the
# lint-fixer's hard limit: thresholds are never moved to make lint pass). The
# original's extension names the file to compare.
assert_lint_config_unchanged() {
	local orig cfg
	orig=$(ls "$LDD_POSTCHECK_DIR"/eslint.orig.config.* 2>/dev/null | head -1)
	if [[ -z "$orig" ]]; then
		echo "FAIL  eslint.orig.config.* missing from $LDD_POSTCHECK_DIR (run task ts-react:manifest)"
		_pc_failures=$((_pc_failures + 1))
		return 1
	fi
	cfg="$EVAL_DIR/eslint.config.${orig##*.}"
	if ! cmp -s "$cfg" "$orig"; then
		diff -u "$orig" "$cfg" | head -n 40 || true
	fi
	assert "eslint.config.${orig##*.} unchanged from the fixture's original" cmp -s "$cfg" "$orig"
}

# last_message_contains <ERE> — greps the run's final agent message, taken from
# the result event in $EVAL_OUT/trace.jsonl (result.json is written after the
# graders run, so the trace is the only artifact a postcheck can read).
last_message_contains() {
	[[ -f "$EVAL_OUT/trace.jsonl" ]] || return 1
	grep '"type":"result"' "$EVAL_OUT/trace.jsonl" | grep -qE -- "$1"
}
