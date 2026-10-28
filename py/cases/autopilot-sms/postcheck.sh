#!/usr/bin/env bash
# autopilot-sms postcheck: the end-state assertions a transcript grader cannot
# make. Runs in the kept scaffold dir (cwd = $EVAL_DIR) after the agent finished;
# $EVAL_OUT holds trace.jsonl. Every check runs (no set -e) so postcheck.txt is
# a complete findings log; the exit code is the failure tally.
#
# Self-contained on purpose, like the Go case: only postcheck/lib.sh's DATA
# (assertion-counts.txt, pyproject.orig.toml) and the black-box suite's
# contract (EVAL_DIR env, `pytest -rA`, a SKIPPED means EVAL_DIR was not
# honoured) are used here.
#
# Checks, in order:
#   1-3  task build / task test / task lint are green on the working tree
#   4    hidden black-box heartbeat suite (postcheck/heartbeat-blackbox), if present
#   5    GET /channels on the running service returns 200 application/json listing sms + the 3 others
#   6    >= 3 commits on top of the scaffold base (prep commit(s) + feature)
#   7    prep before feature: the first commit whose Python code mentions sms is not the first commit
#   8    at least one new test_*.py, and no `env.CONFIG.<field> =` in any NEW test module
#   9    when-in-Rome: pyproject.toml unchanged, no third-party imports, no golden/snapshot mechanism
#   10   no NEW `# noqa`, `# type: ignore` or `# ty: ignore` in the diff (lint-fixer hard limits)
#   11   one owner of the channel literals: "pagerduty" and match/== on a.channel appear
#        at most once each in production code (R11 refactor oracle; manifest count_max 1)
#   12   zero net new production modules in internal/models (RED-zone package); the package-size
#        hook state is reported because the Python plugin's hook is stream 2's to define
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
prod_py() { find . -path ./.git -prune -o -type f -name '*.py' ! -name 'test_*.py' -print; }
count_lines() { grep -c . || true; }
ASSERT_RE='^\s*(assert\b|with pytest\.raises\(|pytest\.fail\()'

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
if [[ -f "$blackbox/test_blackbox.py" ]]; then
  bb_rc=0
  (cd "$blackbox" && EVAL_DIR="$EVAL_DIR" timeout 900 pytest -q -rA -p no:cacheprovider test_blackbox.py) > "$EVAL_OUT/postcheck-blackbox.txt" 2>&1 || bb_rc=$?
  if (( bb_rc != 0 )); then
    fail "heartbeat black-box suite failed (exit $bb_rc) — POST /heartbeat behavior changed (see postcheck-blackbox.txt):"
    grep -E '^(FAILED|E  |line [0-9]+)' "$EVAL_OUT/postcheck-blackbox.txt" | head -n 15 | indent
  elif grep -q 'SKIPPED' "$EVAL_OUT/postcheck-blackbox.txt"; then
    fail "heartbeat black-box suite skipped — EVAL_DIR was not honoured"
  else
    ok "heartbeat black-box suite green ($(grep -c '^PASSED' "$EVAL_OUT/postcheck-blackbox.txt") tests)"
  fi
else
  note "heartbeat black-box suite not present at $blackbox — skipped"
fi

# ---------------------------------------------------------------- 5 GET /channels smoke
free_port() {
  python3 -c 'import socket; s=socket.socket(); s.bind(("127.0.0.1",0)); print(s.getsockname()[1])'
}
# http_get <url> → sets HTTP_CODE, HTTP_CTYPE, HTTP_BODY; returns curl's status
http_get() {
  local out
  out=$(curl -sS -o - -w '\n@@%{http_code}@@%{content_type}' "$1" 2>/dev/null) || return 1
  HTTP_CODE=$(printf '%s' "$out" | sed -n 's/.*@@\([0-9]*\)@@.*/\1/p' | tail -n 1)
  HTTP_CTYPE=$(printf '%s' "$out" | sed -n 's/.*@@[0-9]*@@//p' | tail -n 1)
  HTTP_BODY=${out%$'\n'@@*}
}
if ! command -v curl >/dev/null 2>&1; then
  fail "curl not available — cannot smoke GET /channels"
else
  port=$(free_port) || port=18080
  PORT="$port" PYTHONDONTWRITEBYTECODE=1 python3 -m svc --dry-run > "$EVAL_OUT/postcheck-svc.log" 2>&1 &
  svc_pid=$!
  ready=0
  for _ in $(seq 1 100); do
    if http_get "http://127.0.0.1:$port/healthz" && [[ "$HTTP_CODE" == 200 ]]; then ready=1; break; fi
    sleep 0.1
  done
  if (( ready )); then
    if http_get "http://127.0.0.1:$port/channels"; then
      printf '%s\n' "$HTTP_BODY" > "$EVAL_OUT/postcheck-channels.json"
      if [[ "$HTTP_CODE" != 200 ]]; then
        fail "GET /channels → HTTP $HTTP_CODE (want 200); body: $(printf '%s' "$HTTP_BODY" | head -c 120)"
      elif [[ "$HTTP_CTYPE" != application/json* ]]; then
        fail "GET /channels Content-Type '$HTTP_CTYPE' (want application/json)"
      else
        listed=""
        if command -v jq >/dev/null 2>&1; then
          listed=$(printf '%s' "$HTTP_BODY" | jq -r 'if type=="array" then .[] else (.channels // .)[] end | strings' 2>/dev/null | tr '\n' ' ')
        fi
        if [[ -z "${listed// /}" ]]; then # no jq, or a shape jq did not understand: any lowercase JSON string counts
          listed=$(printf '%s' "$HTTP_BODY" | grep -oE '"[a-z]+"' | tr -d '"' | tr '\n' ' ')
        fi
        missing=""
        for ch in email slack pagerduty sms; do [[ " $listed " == *" $ch "* ]] || missing="$missing $ch"; done
        if [[ -z "$missing" ]]; then ok "GET /channels → 200 application/json listing: $listed"
        else fail "GET /channels body lacks:$missing (listed: ${listed:-<none>}; body: $(printf '%s' "$HTTP_BODY" | head -c 160))"; fi
      fi
    else
      fail "GET /channels: request failed"
    fi
  else
    fail "python -m svc did not become ready on :$port within 10s (see postcheck-svc.log)"
  fi
  kill "$svc_pid" 2>/dev/null; wait "$svc_pid" 2>/dev/null
fi

# ---------------------------------------------------------------- 6 commit count
if (( n_commits >= 3 )); then ok "$n_commits commits since base (>= 3: prep + feature)"
else fail "only $n_commits commit(s) since base; want >= 3 (prep commit(s), then the feature)"; fi
if [[ -n "$(git status --porcelain)" ]]; then note "working tree not clean — uncommitted changes:"; git status --porcelain | head -n 20 | indent; fi

# ---------------------------------------------------------------- 7 prep before feature
# "Touches sms" = a commit whose ADDED Python code lines (# comments stripped) contain sms.
# Commit messages and SPEC.md are ignored so "prepare for SMS" prose does not count.
idx=0; first_sms=-1; sms_free_before=0
while IFS= read -r sha; do
  [[ -z "$sha" ]] && continue
  if git show --format= "$sha" -- '*.py' | grep -E '^\+[^+]' | sed -E 's/#.*$//' | grep -qi 'sms'; then
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
new_tests=$(new_files '*test_*.py' 'test_*.py')
if [[ -z "$new_tests" ]]; then
  fail "no new test_*.py module was added (the feature's RED tests are missing)"
else
  hits=$(printf '%s\n' "$new_tests" | xargs -r grep -nE 'CONFIG\.\w+\s*=[^=]' 2>/dev/null || true)
  if [[ -z "$hits" ]]; then ok "no env.CONFIG.<field> = in $(printf '%s\n' "$new_tests" | wc -l | tr -d ' ') new test module(s)"
  else fail "new test mutates the global config (RED friction should have become a prep move):"; printf '%s\n' "$hits" | indent; fi
fi

# ---------------------------------------------------------------- 9 when-in-Rome
if git diff --quiet "$base" -- pyproject.toml && [[ ! -e requirements.txt && ! -e uv.lock && ! -e poetry.lock ]]; then ok "pyproject.toml unchanged; no lockfile or requirements added"
else fail "dependencies changed: pyproject.toml, a lockfile or requirements.txt differ from base"; fi
foreign=$(grep -rnE '^\s*(from|import) (requests|httpx|pydantic|attrs|attr|flask|fastapi|aiohttp|typer|click|structlog|loguru|tenacity|phonenumbers|hypothesis|responses|freezegun|pytest_mock|mock)\b' --include='*.py' . 2>/dev/null | grep -v '^./.git/' || true)
if [[ -z "$foreign" ]]; then ok "no third-party imports (requests/pydantic/hypothesis/...)"
else fail "third-party import(s) introduced:"; printf '%s\n' "$foreign" | head -n 10 | indent; fi
golden=$(find . -path ./.git -prune -o \( -type d -name testdata -o -type d -name __snapshots__ -o -type f -name '*.golden' -o -type f -name '*.snap' -o -type f -name '*.ambr' \) -print 2>/dev/null | head -n 5 | tr '\n' ' ')
if [[ -z "$golden" ]]; then ok "no golden/snapshot test mechanism introduced"
else fail "new test mechanism the repo does not use: $golden"; fi

# ---------------------------------------------------------------- 10 lint-fixer hard limits
new_noqa=$(added_lines '*.py' | grep -E '# noqa|# type: ignore|# ty: ignore' | count_lines)
if (( new_noqa == 0 )); then ok "no new # noqa, # type: ignore or # ty: ignore directive since base"
else fail "$new_noqa new suppression line(s) added since base:"; added_lines '*.py' | grep -E '# noqa|# type: ignore|# ty: ignore' | head -n 5 | indent; fi

# ---------------------------------------------------------------- 11 one owner of the channel literals
pd=$(prod_py | xargs -r grep -nE '"pagerduty"' 2>/dev/null || true); pd_n=$(printf '%s\n' "$pd" | count_lines)
if (( pd_n <= 1 )); then ok "\"pagerduty\" literal: $pd_n owner(s) in production code (<= 1: the enum or its parser)"
else fail "\"pagerduty\" literal still has $pd_n owners in production code — the channel enum is not named once:"; printf '%s\n' "$pd" | indent; fi
sw=$(prod_py | xargs -r grep -nE 'match a\.channel:|a\.channel == "' 2>/dev/null || true); sw_n=$(printf '%s\n' "$sw" | count_lines)
if (( sw_n <= 1 )); then ok "match/== on a.channel: $sw_n site(s) in production code (manifest count_max 1)"
else fail "a.channel still dispatched at $sw_n sites (R11.Q1 triplicated match unresolved):"; printf '%s\n' "$sw" | indent; fi

# ---------------------------------------------------------------- 12 RED-zone package + hook state
models_base=$(git ls-tree --name-only "$base" internal/models/ | grep -E '\.py$' | grep -vE '(^|/)test_[^/]*\.py$' | grep -v '__init__.py' | count_lines)
models_now=$(find internal/models -maxdepth 1 -type f -name '*.py' ! -name 'test_*.py' ! -name '__init__.py' 2>/dev/null | count_lines)
hook_fired=0; [[ -f "$trace" ]] && grep -q 'Package size gate' "$trace" && hook_fired=1
if (( hook_fired )); then note "package-size hook fired during the run (trace contains 'Package size gate')"
else note "package-size hook did not fire: the Python plugin's hook is stream 2's to define — the RED-zone gate is unobservable in this eval"; fi
if (( models_now <= models_base )); then ok "internal/models: $models_now production modules (base $models_base) — no net new module in the RED-zone package"
else fail "internal/models grew from $models_base to $models_now production modules — new code landed in the RED-zone package (hook fired=$hook_fired)"; fi

# ---------------------------------------------------------------- 13 assertions not weakened
baseline="$evals_dir/postcheck/assertion-counts.txt"   # lines: "<count> <path>" as produced by grep -c over the assertion regex
if [[ -f "$baseline" ]]; then
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
note "sms modules by find (placement, any depth): $(find internal svc -type f -iname '*sms*.py' 2>/dev/null | tr '\n' ' ')"
if [[ -f "$trace" ]] && command -v python3 >/dev/null 2>&1; then
  python3 - "$trace" "$EVAL_OUT/design-plan.txt" <<'PY' && note "DESIGN PLAN block(s) extracted to $EVAL_OUT/design-plan.txt (human review only: postcheck runs after the llm graders)"
import json, sys
src, dst = sys.argv[1], sys.argv[2]
plans = []
with open(src, encoding="utf-8", errors="replace") as f:
    for line in f:
        line = line.strip()
        if not line:
            continue
        try:
            ev = json.loads(line)
        except ValueError:
            continue
        if ev.get("type") != "assistant":
            continue
        for block in (ev.get("message") or {}).get("content") or []:
            text = block.get("text") if isinstance(block, dict) else None
            if text and "DESIGN PLAN" in text:
                plans.append(text)
with open(dst, "w", encoding="utf-8") as out:
    out.write("\n\n=====\n\n".join(plans) if plans else "(no assistant text block contains 'DESIGN PLAN')\n")
PY
fi

finish
