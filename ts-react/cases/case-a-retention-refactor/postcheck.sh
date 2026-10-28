#!/usr/bin/env bash
# Case A postcheck: behavior preserved, lint green, the retention rule has one
# owner, the new type answers R2's falsifying questions, rung-0 test exists.
set -uo pipefail
here="$(dirname "$(readlink -f "$0")")"
# postcheck/lib.sh is two levels up in this repository (ts-react/cases/<case>/) and
# one level up when the suite is copied under <plugin>/evals/ for a run.
for lib in "$here/../../postcheck/lib.sh" "$here/../postcheck/lib.sh"; do
  [ -f "$lib" ] && { . "$lib"; break; }
done

assert "task test green" run_task test
assert "task lint green" run_task lint

# R1 Q2 oracle: the range predicate (literal 365 or a named max) has one owner.
owners=$(count_matches_prod '(>|<=?) ?(365|[a-zA-Z_.]*[mM]ax[A-Za-z_]*)\b' 'src/features/snapshot/*.ts')
assert_le "retention range predicate has one owner in src/features/snapshot" "$owners" 1
assert_le "the \"d\" suffix is parsed once (one boundary parse)" \
  "$(count_matches_prod "endsWith\('d'\)|replace\(/d\\\$/|replace\('d', ''\)|slice\(0, ?-1\)" 'src/features/snapshot/*.ts')" 1
assert_le "raw retention value inspected at most once downstream" \
  "$(count_matches_prod "raw(\['retention'\]|\.retention\b|\.get\('retention'\))" 'src/features/snapshot/*.ts')" 1

# A NEW type exists in src/features/snapshot (WindowPlan and friends pre-exist,
# so only exported types absent at the base commit count).
new_types=$(new_type_names 'src/features/snapshot/*.ts')
echo "new types: ${new_types:-<none>}"
assert_ge "a new type exists in src/features/snapshot" "$(wc -w <<<"$new_types")" 1

# R2: the new type validates at construction — a parse/from function, a static
# factory or a throwing constructor in its module — and a class never exposes
# mutable public fields.
calls=0
for t in $new_types; do
  def=$(cd "$EVAL_DIR" && grep -lE "^export (declare )?(abstract )?(class|interface|type|enum|const enum) $t\b" src/features/snapshot/*.ts | grep -vE '\.test\.' | head -1)
  [[ -z "$def" ]] && continue
  assert_ge "$t's module has a constructor that can refuse (parse*/from*/create*/constructor)" \
    "$(grep -cE "(function (parse|from|create|of)\w*|static (parse|from|create|of)\w*|constructor)\(" "$EVAL_DIR/$def")" 1
  assert_ge "$t's module throws on a bad value" "$(grep -cE '^\s+throw ' "$EVAL_DIR/$def")" 1
  if grep -qE "^export class $t\b" "$EVAL_DIR/$def"; then
    body=$(awk -v t="$t" '$0 ~ ("^export class " t "\\b") {p=1; next} p && /^(export )?(class|function|const|interface|type) / {exit} p {print}' "$EVAL_DIR/$def")
    assert_eq "$t has no public mutable fields" "$(grep -cE '^  (public )?[a-z][A-Za-z0-9_]*(\?)?: ' <<<"$body")" 0
  fi
  # R7: a rung-0 test (no vi.mock of a sibling, no vi.spyOn on a namespace) exercises the type.
  n=$(external_test_calls "\b(new $t|$t\.(parse|from|create|of)\w*|(parse|from|create)$t)\(" 'src/features/snapshot/*.test.ts')
  calls=$((calls + n))
done
assert_ge "a rung-0 test in src/features/snapshot calls a new type's constructor" "$calls" 1

assert_eq "no suppression left in src/features/snapshot" "$(count_suppressions 'src/features/snapshot/*.ts')" 0
echo "== shipped =="
assert_ge "at least one commit after the scaffold base (the green tree is committed)" "$(commits_since_base)" 1
assert_eq "working tree clean at the end (nothing left uncommitted)" "$(git -C "$EVAL_DIR" status --porcelain | grep -c .)" 0

assert "black-box heartbeat suite" run_blackbox
finish
