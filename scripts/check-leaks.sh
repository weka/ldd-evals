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
# script scans itself like any other file. A finding names the file, the line and
# the rule, never the matched text, so the CI log holds no copy of the leak.
#
# Usage: bash scripts/check-leaks.sh
# Exit status: 0 clean, 1 findings, 2 the scan could not run.
set -uo pipefail
root=$(cd "$(dirname "$0")/.." && pwd)
cd "$root" || exit 2
git rev-parse --is-inside-work-tree >/dev/null 2>&1 || { echo "check-leaks: $root is not a git work tree" >&2; exit 2; }

# Each rule is "<name>|<extended regular expression>"; the name holds no "|".
sep='[\\/]+'
rules=(
  "home folder path|${sep}Users${sep}[A-Za-z0-9._-]+"
  "home folder path|${sep}home${sep}[A-Za-z0-9._-]+"
  'home folder path|%2F(Users|home)%2F[A-Za-z0-9._-]+'
  'home folder path|-(Users|home)-[A-Za-z0-9._]+-'
  "macOS temp folder|${sep}var${sep}folders${sep}[A-Za-z0-9_]+${sep}[A-Za-z0-9_]+"
  'Weka email address|[A-Za-z0-9._%+-]+@([A-Za-z0-9-]+\.)*weka(io)?\.(io|com)'
  'claude.ai connector tool name|mcp__[0-9a-f]{8}-[0-9a-f]{4}-'
  'claude.ai connector tool name|mcp__claude[_]ai_'
  'Anthropic API key|sk-ant-[A-Za-z0-9_-]{10}'
  'GitHub token|gh[pousr]_[A-Za-z0-9]{30}'
  'GitHub token|github_pat_[A-Za-z0-9_]{20}'
  'Slack token|xox[abpr]-[A-Za-z0-9-]{10}'
  'Slack token|xapp-[0-9]-'
  'AWS access key|(AKIA|ASIA)[0-9A-Z]{16}'
  'AWS secret key|aws_secret_access_key.{0,3}[=:]'
  'Google API key|AIza[0-9A-Za-z_-]{35}'
  'private key|-----BEGIN [A-Z ]*PRIVATE KEY-----'
)
allowed_homes='(([\\/]+|%2F)home([\\/]+|%2F)|-home-)(user|runner)-?$'

hits=""
for rule in "${rules[@]}"; do
  name=${rule%%|*}
  # -z prints "<file>NUL<line>NUL<match>": the match decides the allow list,
  # and only the file and the line reach the output. git grep exits 1 when
  # nothing matches; any higher status means the scan failed.
  found=$(
    git grep -z -I -i -n -o -E -e "${rule#*|}" -- . |
      ALLOWED=$allowed_homes NAME=$name perl -ne '
        chomp; my ($file, $line, $match) = split /\0/, $_, 3;
        next if $match =~ /$ENV{ALLOWED}/i or $seen{"$file:$line"}++;
        print "$file:$line: $ENV{NAME}\n";
      '
    status=("${PIPESTATUS[@]}")
    (( status[0] <= 1 && status[1] == 0 ))
  ) || { echo "check-leaks: the scan for \"$name\" failed" >&2; exit 2; }
  hits+=$found$'\n'
done

# The file lists read NUL-separated names, because git quotes a name that holds
# a tab, a newline or a non-ASCII character. A name prints with its tabs and
# newlines escaped, so one file is one line of the report.
files=$(git ls-files -z | tr -cd "\0" | wc -c) || { echo "check-leaks: git ls-files failed" >&2; exit 2; }
traces=$(git ls-files -z | perl -0ne '
  chomp; next unless m{(^|/)traces?\.(jsonl?|tar)(\.[a-z0-9]+)*$}i;
  s/\t/\\t/g; s/\n/\\n/g; print "$_\n";
') || { echo "check-leaks: the scan for trace files failed" >&2; exit 2; }
binaries=$(git ls-files -z --eol | perl -0ne '
  chomp; next unless s{^i/-text\s[^\t]*\t}{};
  s/\t/\\t/g; s/\n/\\n/g; print "$_\n";
') || { echo "check-leaks: the scan for binary files failed" >&2; exit 2; }

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
echo "check-leaks: OK ($(( files )) tracked files)"
