#!/usr/bin/env bash
# Leak check for this repository: fails when a tracked file holds data from
# the machine or the account that ran an eval. It flags a home folder path (also
# in its JSON-escaped, URL-encoded, Windows and Claude project folder forms), a
# per-user macOS temp folder, a Weka email address, a claude.ai connector tool
# name, a credential, a trace file in any folder (traces belong in the internal
# weka/ldd-evals-traces repo), and a binary file, because a binary file cannot
# be scanned. Two home folders are allowed: /home/user (a cloud session) and
# /home/runner (GitHub Actions); neither holds personal data.
#
# The patterns are written so that no pattern matches its own text, so the
# script scans itself like any other file.
#
# Usage: bash scripts/check-leaks.sh
# Exit status: 0 clean, 1 findings, 2 the scan could not run.
set -uo pipefail
root=$(cd "$(dirname "$0")/.." && pwd)
cd "$root" || exit 2
git rev-parse --is-inside-work-tree >/dev/null 2>&1 || { echo "check-leaks: $root is not a git work tree" >&2; exit 2; }

sep='[\\/]+'
patterns=(
  "${sep}Users${sep}[A-Za-z0-9._-]+"
  "${sep}home${sep}[A-Za-z0-9._-]+"
  '%2F(Users|home)%2F[A-Za-z0-9._-]+'
  '-(Users|home)-[A-Za-z0-9._]+-'
  "${sep}var${sep}folders${sep}[A-Za-z0-9_]+${sep}[A-Za-z0-9_]+"
  '[A-Za-z0-9._%+-]+@([A-Za-z0-9-]+\.)*weka(io)?\.(io|com)'
  'mcp__[0-9a-f]{8}-[0-9a-f]{4}-'
  'mcp__claude[_]ai_'
  'sk-ant-[A-Za-z0-9_-]{10}'
  'gh[pousr]_[A-Za-z0-9]{30}'
  'github_pat_[A-Za-z0-9_]{20}'
  'xox[abpr]-[A-Za-z0-9-]{10}'
  'xapp-[0-9]-'
  '(AKIA|ASIA)[0-9A-Z]{16}'
  'aws_secret_access_key.{0,3}[=:]'
  'AIza[0-9A-Za-z_-]{35}'
  '-----BEGIN [A-Z ]*PRIVATE KEY-----'
)
allowed_homes='(([\\/]+|%2F)home([\\/]+|%2F)|-home-)(user|runner)-?$'

args=()
for p in "${patterns[@]}"; do args+=(-e "$p"); done

# git grep exits 1 when nothing matches; any higher status means the scan failed.
matches=$(git grep -I -i -n -o -E "${args[@]}" -- .)
status=$?
(( status > 1 )) && { echo "check-leaks: git grep failed with status $status" >&2; exit 2; }
hits=$(printf '%s\n' "$matches" | grep -viE ":$allowed_homes" | grep . || true)

files=$(git ls-files) || { echo "check-leaks: git ls-files failed" >&2; exit 2; }
traces=$(printf '%s\n' "$files" | grep -iE '(^|/)traces?\.(jsonl?|tar)(\.[a-z0-9]+)*$' || true)
eol=$(git ls-files --eol) || { echo "check-leaks: git ls-files --eol failed" >&2; exit 2; }
binaries=$(printf '%s\n' "$eol" | awk '$1 == "i/-text" { sub(/^[^\t]*\t/, ""); print }')

findings=0
report() { # report <reason> <lines>: print each line with the reason, add to the count
  local line
  while IFS= read -r line; do
    [[ -n $line ]] || continue
    printf '%s%s\n' "$line" "$1"
    findings=$((findings + 1))
  done <<<"$2"
}
report "" "$hits"
report ": trace file; keep it in weka/ldd-evals-traces" "$traces"
report ": binary file; the check cannot scan it" "$binaries"

if (( findings > 0 )); then
  echo "check-leaks: $findings finding(s); remove the data, or replace a path with a placeholder"
  exit 1
fi
echo "check-leaks: OK ($(printf '%s\n' "$files" | grep -c .) tracked files)"
