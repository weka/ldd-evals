#!/usr/bin/env bash
# Case A postcheck: behavior preserved, lint green, the retention rule has one
# owner, the new type answers R2's falsifying questions, rung-0 test exists.
set -uo pipefail
here="$(dirname "$(readlink -f "$0")")"
# postcheck/lib.sh is two levels up in this repository (py/cases/<case>/) and one
# level up when the suite is copied under <plugin>/evals/ for a run.
for lib in "$here/../../postcheck/lib.sh" "$here/../postcheck/lib.sh"; do
  [ -f "$lib" ] && { . "$lib"; break; }
done

assert "task test green" run_task test
assert "task lint green" run_task lint

# R1 Q2 oracle: the range predicate (literal 365 or a named max) has one owner.
owners=$(count_matches_prod '(>|<=?) ?(365|[a-zA-Z_.]*[mM]ax[A-Za-z_]*)\b' 'internal/snapshot/*.py')
assert_le "retention range predicate has one owner in internal/snapshot" "$owners" 1
assert_le "the \"d\" suffix is parsed once (one boundary parse)" \
  "$(count_matches_prod 'removesuffix\("d"\)' 'internal/snapshot/*.py')" 1
assert_le "raw retention value inspected at most once downstream" \
  "$(count_matches_prod 'raw(\["retention"\]|\.get\("retention")' 'internal/snapshot/*.py')" 1

# A NEW type exists in internal/snapshot (Window and Plan pre-exist, so only
# classes absent at the base commit count).
base=$(base_commit)
new_types=$(comm -13 \
  <(git -C "$EVAL_DIR" grep -hoE '^class [A-Z][A-Za-z]+' "$base" -- 'internal/snapshot/*.py' 2>/dev/null | sed 's/^class //' | sort -u) \
  <(cd "$EVAL_DIR" && grep -hoE '^class [A-Z][A-Za-z]+' internal/snapshot/*.py | sed 's/^class //' | sort -u))
echo "new types: ${new_types:-<none>}"
assert_ge "a new type exists in internal/snapshot" "$(wc -w <<<"$new_types")" 1

# R2: the new type validates at construction — a parse/from_* classmethod, a
# __post_init__ or a raising __init__ — and is never built with public fields.
calls=0
for t in $new_types; do
  def=$(cd "$EVAL_DIR" && grep -lE "^class $t\b" internal/snapshot/*.py | grep -v test_ | head -1)
  [[ -z "$def" ]] && continue
  body=$(awk -v t="$t" '$0 ~ ("^class " t "\\b") {p=1; next} p && /^class / {exit} p {print}' "$EVAL_DIR/$def")
  ctor=$(grep -cE 'def (parse|from_[a-z_]+|__post_init__|__init__)\(' <<<"$body")
  assert_ge "$t has a constructor that can refuse (parse/from_*/__post_init__/__init__)" "$ctor" 1
  assert_ge "$t raises on a bad value" "$(grep -cE '^\s+raise ' <<<"$body")" 1
  if ! grep -B1 -E "^class $t\b" "$EVAL_DIR/$def" | grep -qE '^@dataclass\(frozen=True\)'; then
    assert_eq "$t has no public dataclass fields (or is frozen)" "$(grep -cE '^    [a-z][a-z0-9_]*: ' <<<"$body")" 0
  fi
  # R7: a rung-0 test (a test module importing no private name) exercises the type.
  n=$(external_test_calls "\b$t(\.parse|\.from_[a-z_]+)?\(" 'internal/snapshot/test_*.py')
  calls=$((calls + n))
done
assert_ge "a rung-0 test in internal/snapshot calls a new type's constructor" "$calls" 1

assert_eq "no # noqa left in internal/snapshot" "$(count_matches '# noqa' 'internal/snapshot/*.py')" 0
echo "== shipped =="
assert_ge "at least one commit after the scaffold base (the green tree is committed)" "$(commits_since_base)" 1
assert_eq "working tree clean at the end (nothing left uncommitted)" "$(git -C "$EVAL_DIR" status --porcelain | grep -c .)" 0

assert "black-box heartbeat suite" run_blackbox
finish
