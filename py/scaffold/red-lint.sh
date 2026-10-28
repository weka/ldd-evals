#!/usr/bin/env bash
# Scaffold the fixture with every `# noqa`, `# type: ignore` and `# ty: ignore`
# directive stripped, so ruff and mypy go red on the design plants and the lint-fixer's
# escalation routing is exercised. Same base commit shape as default.sh; the
# stripped state IS the committed state, so a Quickfix run's diff is only the
# agent's work.
#
# Lint in Python is a linter plus a type checker, each with its own directive:
# ruff reads `# noqa[: CODES]`, mypy reads `# type: ignore[codes]` and ty reads
# `# ty: ignore[rules]`. All go, along with any trailing comment after them
# (`# TODO`, `# loaded in main, ...`). The fixture runs mypy today; the ty form is
# stripped too so a ty plant needs no scaffold change.
#
# Usage: scaffold/red-lint.sh <dest-dir>
set -euo pipefail

dest="${1:?usage: red-lint.sh <dest-dir>}"
here=$(cd "$(dirname "$0")" && pwd)
fixture="$here/../fixture/py-mini"

mkdir -p "$dest"
cp -R "$fixture/." "$dest/"
cd "$dest"
find . -name __pycache__ -type d -prune -exec rm -rf {} +
rm -rf .mypy_cache .ruff_cache .pytest_cache
# Remove trailing `# noqa[: CODES] [# reason]`, `# type: ignore[codes] [# reason]` and
# `# ty: ignore[rules] [# reason]` from every Python line; the code itself is untouched.
find . -name '*.py' -not -path './.git/*' -print0 \
  | xargs -0 sed -i -E \
      -e 's@[[:space:]]*# noqa(: [A-Za-z0-9, ]+)?([[:space:]]*# .*)?$@@' \
      -e 's@[[:space:]]*# type: ignore(\[[a-z, -]+\])?([[:space:]]*# .*)?$@@' \
      -e 's@[[:space:]]*# ty: ignore(\[[a-z, -]+\])?([[:space:]]*# .*)?$@@'
git init -q
git -c user.name=fixture -c user.email=fixture@example.com add -A
git -c user.name=fixture -c user.email=fixture@example.com commit -q -m "py-mini: initial import (lint directives removed)"
# grep exits 1 when nothing is left, which is the success case here.
remaining=$({ grep -rn -e '# noqa' -e '# type: ignore' -e '# ty: ignore' --include='*.py' . || true; } | wc -l)
echo "scaffolded py-mini (red-lint) at $dest ($(git rev-parse --short HEAD)); lint directives remaining: $remaining"
