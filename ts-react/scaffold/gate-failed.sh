#!/usr/bin/env bash
# Scaffold a small TypeScript repository for the review-gate-failed case, whose
# case.yaml sets CHECK_REPO_BRAIN_FAULT so the repo-brain gate fails on it.
# Three doc defects are planted, each one that only the gate's questions find:
# an orphan doc (R9 Q1), a doc citing a symbol the code does not declare (R9 Q2),
# and a CLAUDE.md that does not import the doc index (R9 Q3). The code has no
# exported declaration and no other rule's lead, so the documentation family is
# the only one with a hunter, and only because its gate rows are inconclusive.
#
# Usage: scaffold/gate-failed.sh <dest-dir>
set -euo pipefail

dest="${1:?usage: gate-failed.sh <dest-dir>}"
mkdir -p "$dest/docs"
cd "$dest"

mkdir -p src/notes
cat > package.json <<'JSON'
{
  "name": "notes",
  "version": "0.1.0",
  "private": true,
  "type": "module"
}
JSON
cat > src/notes/store.ts <<'TS'
import { writeFileSync } from "node:fs";

function writeAll(path: string, data: string): void {
  writeFileSync(path, data);
}

void writeAll;
TS
cat > docs/index.md <<'MD'
---
okf_version: "0.2"
---
# Map

- [store.md](store.md) — how notes reach the disk
MD
cat > docs/store.md <<'MD'
---
type: feature
description: how notes reach the disk
---
# Store

Every note goes through `store.flushAll`, which writes the whole file at once.
MD
cat > docs/retention.md <<'MD'
---
type: feature
description: how long notes are kept
---
# Retention

Notes are kept for thirty days.
MD
printf '# Notes\n\nA small notes service.\n' > CLAUDE.md

git init -q
git -c user.name=fixture -c user.email=fixture@example.com add -A
git -c user.name=fixture -c user.email=fixture@example.com commit -q -m "notes: initial import"
echo "scaffolded the gate-failed repository at $dest ($(git rev-parse --short HEAD))"
