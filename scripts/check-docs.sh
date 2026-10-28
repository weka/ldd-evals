#!/usr/bin/env bash
# Documentation conformance for this repository: runs the Go plugin's repo-brain
# gate over the repository and drops the lines about the fixtures (go-mini,
# py-mini and ts-react-mini), whose documentation violations are planted on purpose (they are
# what the evals measure). Anything that remains is a real violation in this
# repository's docs.
#
# Usage: bash scripts/check-docs.sh [plugin-dir] [--fix]
#   plugin-dir: the go-linter-driven-development directory of a plugin checkout
#               (default: ../ai-coding-rules/go-linter-driven-development)
set -uo pipefail
root=$(cd "$(dirname "$0")/.." && pwd)
plugin="${1:-$root/../ai-coding-rules/go-linter-driven-development}"
shift $(( $# > 0 ? 1 : 0 ))
gate="$plugin/scripts/check-repo-brain.sh"
[[ -f "$gate" ]] || { echo "check-docs: gate not found at $gate (pass the plugin dir)"; exit 2; }
fixture_re='(go|py|ts-react)/fixture/'
out=$(cd "$root" && bash "$gate" "$@" . 2>&1)
status=$?
real=$(printf '%s\n' "$out" | grep -E '^\s*\[Q[0-9]+\]' | grep -vE "$fixture_re" || true)
if [[ -n "$real" ]]; then
  printf '%s\n' "$real"
  echo "check-docs: $(printf '%s\n' "$real" | wc -l | tr -d ' ') violation(s) outside the fixture — rules: docs/conventions.md"
  exit 1
fi
if [[ $status -eq 2 ]]; then printf '%s\n' "$out" | tail -n 3; echo "check-docs: gate scanner failure"; exit 2; fi
echo "check-docs: OK (fixture plants ignored: $(printf '%s\n' "$out" | grep -cE "$fixture_re"))"
