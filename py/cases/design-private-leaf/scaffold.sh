#!/usr/bin/env bash
# Case-local scaffold for design-private-leaf: the default fixture scaffold plus
# the spec at the repository root, amended into the base commit so the agent sees
# SPEC-webhook.md as part of the repository it was handed.
#
# Usage: design-private-leaf/scaffold.sh <dest-dir>   (the runner calls it with cwd = this dir)
set -euo pipefail

dest="${1:?usage: scaffold.sh <dest-dir>}"
here=$(cd "$(dirname "$0")" && pwd)

"$here/../scaffold/default.sh" "$dest"

cp "$here/SPEC-webhook.md" "$dest/SPEC-webhook.md"
cd "$dest"
git add SPEC-webhook.md
git -c user.name=fixture -c user.email=fixture@example.com commit -q --amend --no-edit
echo "design-private-leaf: SPEC-webhook.md amended into base $(git rev-parse --short HEAD)"
