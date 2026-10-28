#!/usr/bin/env bash
# autopilot-sms postcheck: the end-state assertions a transcript grader cannot
# make. Runs in the kept scaffold dir (cwd = $EVAL_DIR) after the agent finished;
# $EVAL_OUT holds trace.jsonl. Every check runs (no set -e) so postcheck.txt is
# a complete findings log; the exit code is the failure tally.
#
# Self-contained on purpose, like the Go and Python cases: only postcheck/lib.sh's
# DATA (assertion-counts.txt, eslint.orig.config.js) and the black-box suite's
# files (heartbeat-blackbox/blackbox.test.tsx + expected.tsv, dropped into
# src/__blackbox__/ and run with Vitest) are used here.
#
# Checks, in order:
#   1-3  task build / task test / task lint are green on the working tree
#   4    hidden black-box heartbeat suite (postcheck/heartbeat-blackbox), if present
#   5    the channel list has one owner that names sms beside the three others
#   6    >= 3 commits on top of the scaffold base (prep commit(s) + feature)
#   7    prep before feature: the first commit whose TypeScript code mentions sms is not the first commit
#   8    at least one new *.test.ts(x), and no `CONFIG.<field> =` in any NEW test module
#   9    when-in-Rome: package.json and package-lock.json unchanged, no imports from packages the
#        repo does not install, no snapshot-test mechanism
#   10   no NEW `eslint-disable` / `/* eslint … */` / `@ts-expect-error` / `@ts-ignore` in the diff (lint-fixer hard limits)
#   11   one owner of the channel literals: 'pagerduty' and switch/=== on the channel appear
#        at most once each in production code (R11 refactor oracle; manifest count_max 1)
#   12   zero net new production modules in src/types (RED-zone folder); the package-size
#        hook state is reported because this plugin's hook is undefined
#   13   fixture test assertion counts not weakened (baseline: postcheck/assertion-counts.txt)
#   +    NOTES (never fail): DESIGN PLAN extracted to $EVAL_OUT/design-plan.txt, sms module
#        placement by `find`, dirty working tree, hook fired or not
set -u
export PATH="$PATH:/root/.local/bin:$HOME/.local/bin:/root/go/bin"

EVAL_DIR="${EVAL_DIR:-$PWD}"
EVAL_OUT="${EVAL_OUT:-$EVAL_DIR/.eval-out}"
mkdir -p "$EVAL_OUT"
cd "$EVAL_DIR" || { echo "FAIL  cannot cd to $EVAL_DIR"; exit 1; }

here=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
evals_dir=$(cd "$here/.." && pwd)
trace="$EVAL_OUT/trace.jsonl"

failures=0
fail() { printf 'FAIL  %s\n' "$*"; failures=$((failures + 1)); }
ok()   { printf 'ok    %s\n' "$*"; }
note() { printf 'NOTE  %s\n' "$*"; }
indent() { sed 's/^/      /'; }
finish() {
  if (( failures > 0 )); then printf 'postcheck: %d failure(s)\n' "$failures"; exit 1; fi
  echo "postcheck: all assertions passed"; exit 0
}

base=$(git rev-list --max-parents=0 HEAD)
n_commits=$(git rev-list --count "$base..HEAD")
echo "autopilot-sms postcheck · base $(git rev-parse --short "$base") · HEAD $(git rev-parse --short HEAD) · $n_commits commit(s) since base"

# Files the agent added (committed or untracked), for the "new file" checks.
new_files() {
  { git diff --name-only --diff-filter=A "$base" HEAD -- "$@"
    git ls-files --others --exclude-standard -- "$@"; } | sort -u
}
# Added lines since base: committed + uncommitted diff, plus untracked files whole.
added_lines() {
  git diff "$base" -- "$@" | grep -E '^\+[^+]' | sed 's/^+//'
  local f
  while IFS= read -r f; do [[ -f "$f" ]] && cat "$f"; done < <(git ls-files --others --exclude-standard -- "$@")
}
# Production TypeScript: src/**/*.ts(x) minus tests, test infrastructure and the black-box dir.
prod_ts() {
  find src -path '*/node_modules' -prune -o -path 'src/test-utils' -prune -o -path 'src/__blackbox__' -prune -o \
    -type f \( -name '*.ts' -o -name '*.tsx' \) ! -name '*.test.ts' ! -name '*.test.tsx' ! -name '*.d.ts' -print
}
count_lines() { grep -c . || true; }
ASSERT_RE='^\s*(await\s+)?expect(\.soft)?\(|^\s*(expect|assert)\.fail\('
SUPPRESS_RE='eslint-disable|/\* eslint |@ts-expect-error|@ts-ignore|@ts-nocheck'

# ---------------------------------------------------------------- 1-3 build/test/lint
for t in build test lint; do
  if timeout 900 task "$t" > "$EVAL_OUT/postcheck-task-$t.txt" 2>&1; then
    ok "task $t green"
  else
    fail "task $t failed (see postcheck-task-$t.txt):"
    tail -n 12 "$EVAL_OUT/postcheck-task-$t.txt" | indent
  fi
done

# ---------------------------------------------------------------- 4 black-box suite
blackbox="$evals_dir/postcheck/heartbeat-blackbox"
if [[ -f "$blackbox/blackbox.test.tsx" && -f "$blackbox/expected.tsv" ]]; then
  bb_rc=0
  rm -rf src/__blackbox__ && mkdir -p src/__blackbox__
  cp "$blackbox/blackbox.test.tsx" "$blackbox/expected.tsv" src/__blackbox__/
  (CI=1 timeout 900 npx --no vitest run src/__blackbox__ --reporter=dot) > "$EVAL_OUT/postcheck-blackbox.txt" 2>&1 || bb_rc=$?
  rm -rf src/__blackbox__
  if (( bb_rc != 0 )); then
    fail "heartbeat black-box suite failed (exit $bb_rc) — the simulator's behavior changed (see postcheck-blackbox.txt):"
    grep -E '^(FAIL|AssertionError|Expected|Received| ❯ |×)' "$EVAL_OUT/postcheck-blackbox.txt" | head -n 15 | indent
  elif grep -qiE 'no test files found' "$EVAL_OUT/postcheck-blackbox.txt"; then
    fail "heartbeat black-box suite did not run — Vitest found no test file under src/__blackbox__"
  else
    ok "heartbeat black-box suite green ($(grep -oE 'Tests? +[0-9]+ passed' "$EVAL_OUT/postcheck-blackbox.txt" | head -1))"
  fi
else
  note "heartbeat black-box suite not present at $blackbox — skipped"
fi

# ---------------------------------------------------------------- 5 one owner of the channel list, naming sms
channel_owners=$(prod_ts | xargs -r grep -lE "'sms'" 2>/dev/null | xargs -r grep -lE "'pagerduty'" 2>/dev/null || true)
owners_n=$(printf '%s\n' "$channel_owners" | count_lines)
if (( owners_n == 0 )); then
  fail "no production module names 'sms' beside 'pagerduty' — the channel list did not gain sms in one place"
elif (( owners_n > 1 )); then
  fail "'sms' and 'pagerduty' are spelled together in $owners_n modules (want one owner of the channel list):"
  printf '%s\n' "$channel_owners" | indent
else
  ok "channel list has one owner that names sms: $channel_owners"
fi

# ---------------------------------------------------------------- 6 commit count
if (( n_commits >= 3 )); then ok "$n_commits commits since base (>= 3: prep + feature)"
else fail "only $n_commits commit(s) since base; want >= 3 (prep commit(s), then the feature)"; fi
if [[ -n "$(git status --porcelain)" ]]; then note "working tree not clean — uncommitted changes:"; git status --porcelain | head -n 20 | indent; fi

# ---------------------------------------------------------------- 7 prep before feature
# "Touches sms" = a commit whose ADDED TypeScript code lines (// comments stripped) contain sms.
# Commit messages and SPEC.md are ignored so "prepare for SMS" prose does not count.
idx=0; first_sms=-1; sms_free_before=0
while IFS= read -r sha; do
  [[ -z "$sha" ]] && continue
  if git show --format= "$sha" -- '*.ts' '*.tsx' | grep -E '^\+[^+]' | sed -E 's@//.*$@@' | grep -qi 'sms'; then
    (( first_sms < 0 )) && first_sms=$idx
  elif (( first_sms < 0 )); then
    sms_free_before=$((sms_free_before + 1))
  fi
  idx=$((idx + 1))
done < <(git rev-list --reverse "$base..HEAD")
if (( first_sms < 0 )); then fail "no commit adds sms code — the feature was never committed"
elif (( sms_free_before >= 1 )); then ok "first sms commit is #$((first_sms + 1)) of $idx; $sms_free_before sms-free commit(s) precede it (prep before feature)"
else fail "the very first commit already adds sms code — no preparatory commit landed before the feature"; fi

# ---------------------------------------------------------------- 8 new tests exist; no global mutation in them
new_tests=$(new_files '*.test.ts' '*.test.tsx')
if [[ -z "$new_tests" ]]; then
  fail "no new *.test.ts(x) module was added (the feature's RED tests are missing)"
else
  hits=$(printf '%s\n' "$new_tests" | xargs -r grep -nE 'CONFIG\.\w+\s*=[^=]' 2>/dev/null || true)
  if [[ -z "$hits" ]]; then ok "no CONFIG.<field> = in $(printf '%s\n' "$new_tests" | wc -l | tr -d ' ') new test module(s)"
  else fail "new test mutates the global config (RED friction should have become a prep move):"; printf '%s\n' "$hits" | indent; fi
fi

# ---------------------------------------------------------------- 9 when-in-Rome
if git diff --quiet "$base" -- package.json package-lock.json && [[ ! -e yarn.lock && ! -e pnpm-lock.yaml && ! -e bun.lockb ]]; then ok "package.json and package-lock.json unchanged; no other lockfile added"
else fail "dependencies changed: package.json, package-lock.json or another lockfile differ from base"; fi
foreign=$(grep -rnE "^\s*import .* from '(axios|zod|yup|lodash|lodash-es|ramda|date-fns|dayjs|moment|libphonenumber-js|google-libphonenumber|immer|zustand|redux|@reduxjs/toolkit|jest|sinon|nock|fast-check|@storybook/[a-z-]+)'" --include='*.ts' --include='*.tsx' --exclude-dir=node_modules --exclude-dir=.git src 2>/dev/null || true)
if [[ -z "$foreign" ]]; then ok "no imports from packages the repository does not install (axios/zod/libphonenumber/...)"
else fail "import(s) from packages the repository does not install:"; printf '%s\n' "$foreign" | head -n 10 | indent; fi
golden=$( { find src -path '*/node_modules' -prune -o \( -type d -name __snapshots__ -o -type f -name '*.snap' \) -print 2>/dev/null; grep -rlE 'toMatch(Inline)?Snapshot\(' --include='*.test.ts' --include='*.test.tsx' --exclude-dir=node_modules src 2>/dev/null; } | head -n 5 | tr '\n' ' ')
if [[ -z "$golden" ]]; then ok "no snapshot test mechanism introduced"
else fail "new test mechanism the repo does not use: $golden"; fi

# ---------------------------------------------------------------- 10 lint-fixer hard limits
new_suppress=$(added_lines '*.ts' '*.tsx' | grep -E "$SUPPRESS_RE" | count_lines)
if (( new_suppress == 0 )); then ok "no new eslint-disable, @ts-expect-error or @ts-ignore directive since base"
else fail "$new_suppress new suppression line(s) added since base:"; added_lines '*.ts' '*.tsx' | grep -E "$SUPPRESS_RE" | head -n 5 | indent; fi

# ---------------------------------------------------------------- 11 one owner of the channel literals
pd=$(prod_ts | xargs -r grep -nE "'pagerduty'" 2>/dev/null || true); pd_n=$(printf '%s\n' "$pd" | count_lines)
if (( pd_n <= 1 )); then ok "'pagerduty' literal: $pd_n owner(s) in production code (<= 1: the union, enum or its parser)"
else fail "'pagerduty' literal still has $pd_n owners in production code — the channel type is not named once:"; printf '%s\n' "$pd" | indent; fi
sw=$(prod_ts | xargs -r grep -nE "switch \(\w+\.channel\)|\w+\.channel === '" 2>/dev/null || true); sw_n=$(printf '%s\n' "$sw" | count_lines)
if (( sw_n <= 1 )); then ok "switch/=== on .channel: $sw_n site(s) in production code (manifest count_max 1)"
else fail ".channel still dispatched at $sw_n sites (R11.Q1 triplicated switch unresolved):"; printf '%s\n' "$sw" | indent; fi

# ---------------------------------------------------------------- 12 RED-zone folder + hook state
types_base=$(git ls-tree --name-only "$base" src/types/ | grep -E '\.tsx?$' | grep -vE '\.test\.tsx?$' | grep -v '/index.ts$' | count_lines)
types_now=$(find src/types -maxdepth 1 -type f \( -name '*.ts' -o -name '*.tsx' \) ! -name '*.test.ts' ! -name '*.test.tsx' ! -name 'index.ts' 2>/dev/null | count_lines)
hook_fired=0; [[ -f "$trace" ]] && grep -q 'Package size gate' "$trace" && hook_fired=1
if (( hook_fired )); then note "package-size hook fired during the run (trace contains 'Package size gate')"
else note "package-size hook did not fire: this plugin defines no package-size hook — the RED-zone gate is unobservable in this eval"; fi
if (( types_now <= types_base )); then ok "src/types: $types_now production modules (base $types_base) — no net new module in the RED-zone folder"
else fail "src/types grew from $types_base to $types_now production modules — new code landed in the RED-zone folder (hook fired=$hook_fired)"; fi

# ---------------------------------------------------------------- 13 assertions not weakened
baseline="$evals_dir/postcheck/assertion-counts.txt"   # lines: "<count> <path>" as produced by grep -c over the assertion regex
if [[ -s "$baseline" ]]; then
  weakened=0
  while read -r want path; do
    [[ -z "${path:-}" ]] && continue
    if [[ ! -f "$path" ]]; then fail "fixture test module removed: $path (had $want assertion lines)"; weakened=1; continue; fi
    have=$(grep -cE "$ASSERT_RE" "$path" 2>/dev/null || true)
    if (( have < want )); then fail "assertions weakened in $path: $have < $want"; weakened=1; fi
  done < "$baseline"
  (( weakened )) || ok "no fixture test lost assertion lines ($(count_lines < "$baseline") modules vs assertion-counts.txt)"
else
  note "assertion baseline $baseline not available — skipped"
fi

# ---------------------------------------------------------------- NOTES
note "sms modules by find (placement, any depth): $(find src -path '*/node_modules' -prune -o -type f -iname '*sms*' -print 2>/dev/null | tr '\n' ' ')"
if [[ -f "$trace" ]] && command -v node >/dev/null 2>&1; then
  node - "$trace" "$EVAL_OUT/design-plan.txt" <<'JS' && note "DESIGN PLAN block(s) extracted to $EVAL_OUT/design-plan.txt (human review only: postcheck runs after the llm graders)"
const fs = require('node:fs')
const [src, dst] = process.argv.slice(2)
const plans = []
for (const line of fs.readFileSync(src, 'utf8').split('\n')) {
  if (!line.trim()) continue
  let ev
  try { ev = JSON.parse(line) } catch { continue }
  if (ev.type !== 'assistant') continue
  for (const block of (ev.message && ev.message.content) || []) {
    const text = block && typeof block === 'object' ? block.text : undefined
    if (text && text.includes('DESIGN PLAN')) plans.push(text)
  }
}
fs.writeFileSync(dst, plans.length ? plans.join('\n\n=====\n\n') : "(no assistant text block contains 'DESIGN PLAN')\n")
JS
fi

finish
