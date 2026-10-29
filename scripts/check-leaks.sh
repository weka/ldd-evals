#!/usr/bin/env bash
# Leak check for this repository: fails when a tracked file holds data from
# the machine or the account that ran an eval. It flags a home folder path, a
# Weka email address, a claude.ai connector tool name, a credential, and a trace
# file under baselines/ (traces belong in the internal weka/ldd-evals-traces repo).
# Two home folders are allowed: /home/user (a cloud session) and /home/runner
# (GitHub Actions); neither holds personal data.
#
# Usage: bash scripts/check-leaks.sh
set -uo pipefail
root=$(cd "$(dirname "$0")/.." && pwd)
cd "$root" || exit 2
self=scripts/check-leaks.sh

patterns=(
  '/Users/[A-Za-z0-9._-]+'
  '/home/[A-Za-z0-9._-]+'
  '[A-Za-z0-9._%+-]+@weka\.io'
  'mcp__[0-9a-f]{8}-[0-9a-f]{4}-'
  'sk-ant-[A-Za-z0-9_-]{10}'
  'gh[pousr]_[A-Za-z0-9]{30}'
  'github_pat_[A-Za-z0-9_]{20}'
  'xox[abpr]-[A-Za-z0-9-]{10}'
  'AKIA[0-9A-Z]{16}'
  '-----BEGIN [A-Z ]*PRIVATE KEY-----'
)
args=()
for p in "${patterns[@]}"; do args+=(-e "$p"); done

hits=$(git grep -I -n -o -E "${args[@]}" -- . ":(exclude)$self" \
  | grep -vE ':/home/(user|runner)$' || true)
traces=$(git ls-files -- ':(glob)baselines/**/trace.jsonl' ':(glob)**/traces.tar.zst' || true)

if [[ -n "$hits" || -n "$traces" ]]; then
  [[ -n "$hits" ]] && printf '%s\n' "$hits"
  [[ -n "$traces" ]] && printf '%s: trace file; keep it in weka/ldd-evals-traces\n' $traces
  count=$(printf '%s\n%s\n' "$hits" "$traces" | grep -c .)
  echo "check-leaks: $count finding(s); remove the data, or replace a path with a placeholder"
  exit 1
fi
echo "check-leaks: OK ($(git ls-files | wc -l | tr -d ' ') tracked files)"
