#!/usr/bin/env bash
# Scaffold the py-mini fixture into <dest> as a fresh git repo with one commit.
# Every eval case starts from this: the plugin's diff-based commands (git diff,
# git log ratchets) need a base commit, and the agent under test must see a
# repository, not a loose directory.
#
# Usage: scaffold/default.sh <dest-dir>
set -euo pipefail

dest="${1:?usage: default.sh <dest-dir>}"
here=$(cd "$(dirname "$0")" && pwd)
fixture="$here/../fixture/py-mini"

mkdir -p "$dest"
cp -R "$fixture/." "$dest/"
cd "$dest"
find . -name __pycache__ -type d -prune -exec rm -rf {} +
rm -rf .mypy_cache .ruff_cache .pytest_cache
git init -q
git -c user.name=fixture -c user.email=fixture@example.com add -A
git -c user.name=fixture -c user.email=fixture@example.com commit -q -m "py-mini: initial import"
echo "scaffolded py-mini at $dest ($(git rev-parse --short HEAD))"
