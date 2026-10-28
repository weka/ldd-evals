#!/usr/bin/env bash
# set-cmd-prefix.sh — write the plugin's command prefix into a copied suite.
#
# Case prompts, graders, postchecks and scaffolds name the plugin's slash
# commands and its announcement line ("Using go-ldd workflow"). Two plugins
# built from the same core differ only in that prefix — go-ldd, ldd, py-ldd —
# so the source cases carry the token {{cmd_prefix}} and the copy under
# <plugin>/evals gets the real prefix. The copy is what the runner and the
# built-in `claude plugin eval` gate read, so it stays a plain, concrete suite.
#
# Usage: scripts/set-cmd-prefix.sh <evals-dir> <prefix>
#   <evals-dir>  the copied suite (the go:cases / py:cases destination)
#   <prefix>     the plugin's command prefix, e.g. go-ldd
# The fixture directory is left alone: it is code under test, not a case.
set -euo pipefail

dir=${1:?usage: set-cmd-prefix.sh <evals-dir> <prefix>}
prefix=${2:?usage: set-cmd-prefix.sh <evals-dir> <prefix>}
[[ -d $dir ]] || { echo "set-cmd-prefix: not a directory: $dir" >&2; exit 2; }
[[ $prefix =~ ^[a-z0-9][a-z0-9-]*$ ]] || { echo "set-cmd-prefix: prefix must be lower-case letters, digits and dashes: $prefix" >&2; exit 2; }

n=0
while IFS= read -r f; do
  perl -pi -e "s/\{\{cmd_prefix\}\}/$prefix/g" "$f"
  n=$((n + 1))
done < <(grep -rl --include='*.md' --include='*.sh' --include='*.yaml' -F '{{cmd_prefix}}' "$dir" --exclude-dir=fixture 2>/dev/null || true)
echo "set-cmd-prefix: $prefix written into $n file(s) under $dir"
