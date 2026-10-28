#!/usr/bin/env bash
# gen-assertion-counts.sh — write (or check) postcheck/assertion-counts.txt,
# the per-file count of assertion lines in the fixture's Vitest files that
# `assert_assertions_kept` in lib.sh holds an agent's tree to: one
# `<count> <path>` line per *.test.ts(x) under src/, counted with lib.sh's
# ASSERTION_RE so the baseline and the check agree on what an assertion is.
#
# Usage: postcheck/gen-assertion-counts.sh            # rewrite the file from the fixture
#        postcheck/gen-assertion-counts.sh --check    # exit 1 when the file has drifted
set -euo pipefail

here=$(cd "$(dirname "$0")" && pwd)
fixture="$here/../fixture/ts-react-mini"
out="$here/assertion-counts.txt"
ASSERTION_RE='^\s*(await\s+)?expect(\.soft)?\(|^\s*(expect|assert)\.fail\('

[[ -d "$fixture/src" ]] || { echo "gen-assertion-counts: fixture not found at $fixture" >&2; exit 2; }

counts=$(cd "$fixture" && find ./src -type f \( -name '*.test.ts' -o -name '*.test.tsx' \) -not -path '*/node_modules/*' | sort |
	while IFS= read -r f; do
		n=$(grep -cE "$ASSERTION_RE" "$f" || true)
		printf '%s %s\n' "$n" "$f"
	done)

if [[ "${1:-}" == "--check" ]]; then
	if [[ ! -f "$out" ]]; then
		echo "gen-assertion-counts: $out missing — run $0" >&2
		exit 1
	fi
	if ! diff -u "$out" <(printf '%s\n' "$counts"); then
		echo "gen-assertion-counts: assertion-counts.txt has drifted from the fixture — run $0" >&2
		exit 1
	fi
	echo "gen-assertion-counts: OK ($(printf '%s\n' "$counts" | grep -c .) test files)"
	exit 0
fi

printf '%s\n' "$counts" >"$out"
echo "gen-assertion-counts: $(grep -c . "$out") test files → $out"
