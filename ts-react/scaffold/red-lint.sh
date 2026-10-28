#!/usr/bin/env bash
# Scaffold the fixture with every ESLint and TypeScript suppression stripped, so
# `eslint` and `tsc` go red on the design plants and the lint-fixer's escalation
# routing is exercised. Same base commit shape as default.sh; the stripped
# state IS the committed state, so a Quickfix run's diff is only the agent's
# work.
#
# Lint in TypeScript is a linter plus a type checker, each with its own
# directive. ESLint reads `// eslint-disable-next-line <rules> -- <reason>`,
# `// eslint-disable-line <rules>`, `/* eslint-disable <rules> */` and the
# configuration comment `/* eslint <rule>: "off" */`; tsc reads
# `// @ts-expect-error <reason>` and `// @ts-ignore <reason>`. Whole-line
# directives go with their line (the JSX form `{/* eslint-disable-next-line */}`
# too); a trailing `// eslint-disable-line` goes with any reason after it and
# leaves the code in front of it untouched.
#
# Usage: scaffold/red-lint.sh <dest-dir>
set -euo pipefail

dest="${1:?usage: red-lint.sh <dest-dir>}"
here=$(cd "$(dirname "$0")" && pwd)
fixture="$here/../fixture/ts-react-mini"

mkdir -p "$dest"
cp -R "$fixture/." "$dest/"
cd "$dest"
rm -rf node_modules dist coverage .eslintcache tsconfig.tsbuildinfo
find . -name '*.tsbuildinfo' -not -path './.git/*' -delete

# Whole lines that are only a directive are deleted; trailing
# `// eslint-disable-line ...` and `/* eslint-disable-line ... */` tails are cut.
# The file-level configuration comment `/* eslint <rule>: "off" */` goes too:
# sonarjs/max-lines reports at line 0, before any disable directive, so the
# god file silences it with that form and nothing else (see violations.yaml,
# R5.Q1.god-file).
find . \( -name '*.ts' -o -name '*.tsx' \) -not -path './.git/*' -not -path './node_modules/*' -print0 \
  | xargs -0 sed -i -E \
      -e '\#^[[:space:]]*(\{[[:space:]]*)?//[[:space:]]*eslint-disable-next-line\b.*$#d' \
      -e '\#^[[:space:]]*(\{[[:space:]]*)?/\*[[:space:]]*eslint-(disable(-next-line)?|enable)\b[^*]*\*/[[:space:]]*(\})?[[:space:]]*$#d' \
      -e '\#^[[:space:]]*/\* eslint #d' \
      -e '\#^[[:space:]]*//[[:space:]]*eslint-(disable|enable)\b.*$#d' \
      -e '\#^[[:space:]]*//[[:space:]]*@ts-(expect-error|ignore|nocheck)\b.*$#d' \
      -e 's@[[:space:]]*//[[:space:]]*eslint-disable-line\b.*$@@' \
      -e 's@[[:space:]]*/\*[[:space:]]*eslint-disable-line\b[^*]*\*/[[:space:]]*$@@'

git init -q
git -c user.name=fixture -c user.email=fixture@example.com add -A
git -c user.name=fixture -c user.email=fixture@example.com commit -q -m "ts-react-mini: initial import (lint directives removed)"

export npm_config_cache="${TMPDIR:-/tmp}/ts-react-mini-npm-cache"
mkdir -p "$npm_config_cache"
npm ci --prefer-offline --no-audit --no-fund --loglevel=error >/dev/null

# grep exits 1 when nothing is left, which is the success case here.
remaining=$({ grep -rnE -e 'eslint-disable' -e '/\* eslint ' -e '@ts-(expect-error|ignore|nocheck)' --include='*.ts' --include='*.tsx' --exclude-dir=node_modules --exclude-dir=.git . || true; } | wc -l)
echo "scaffolded ts-react-mini (red-lint) at $dest ($(git rev-parse --short HEAD)); lint directives remaining: $remaining"
