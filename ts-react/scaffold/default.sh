#!/usr/bin/env bash
# Scaffold the ts-react-mini fixture into <dest> as a fresh git repo with one
# commit and an installed node_modules. Every eval case starts from this: the
# plugin's diff-based commands (git diff, git log ratchets) need a base commit,
# and the agent under test must see a repository, not a loose directory.
#
# node_modules is installed from the committed package-lock.json with
# `npm ci`, through a shared npm cache under ${TMPDIR:-/tmp} so the first
# scaffold of a run downloads once and every later one is seconds; the
# fixture's .gitignore keeps node_modules out of the base commit. The runner
# gives a scaffold five minutes.
#
# Usage: scaffold/default.sh <dest-dir>
set -euo pipefail

dest="${1:?usage: default.sh <dest-dir>}"
here=$(cd "$(dirname "$0")" && pwd)
fixture="$here/../fixture/ts-react-mini"

mkdir -p "$dest"
cp -R "$fixture/." "$dest/"
cd "$dest"
rm -rf node_modules dist coverage .eslintcache tsconfig.tsbuildinfo
find . -name '*.tsbuildinfo' -not -path './.git/*' -delete
git init -q
git -c user.name=fixture -c user.email=fixture@example.com add -A
git -c user.name=fixture -c user.email=fixture@example.com commit -q -m "ts-react-mini: initial import"

export npm_config_cache="${TMPDIR:-/tmp}/ts-react-mini-npm-cache"
mkdir -p "$npm_config_cache"
npm ci --prefer-offline --no-audit --no-fund --loglevel=error >/dev/null
echo "scaffolded ts-react-mini at $dest ($(git rev-parse --short HEAD); node_modules from $npm_config_cache)"
