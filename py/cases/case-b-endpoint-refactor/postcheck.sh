#!/usr/bin/env bash
# Case B postcheck: behavior preserved, lint green, one owner for the port
# range, a new type owning the trio in transport, no suppressions.
set -uo pipefail
here="$(dirname "$(readlink -f "$0")")"
# postcheck/lib.sh is two levels up in this repository (py/cases/<case>/) and one
# level up when the suite is copied under <plugin>/evals/ for a run.
for lib in "$here/../../postcheck/lib.sh" "$here/../postcheck/lib.sh"; do
  [ -f "$lib" ] && { . "$lib"; break; }
done

assert "task test green" run_task test
assert "task lint green" run_task lint

assert_le "port range predicate (65535 or a named max port) has one owner" \
  "$(count_matches_prod '(<|>) ?(65535|[a-zA-Z_.]*[mM]ax[A-Za-z_]*[Pp]ort[A-Za-z_]*)\b' 'internal/transport/*.py')" 1
# The scheme is chosen wherever "https" is spelled; the TLS flag may still be
# consulted elsewhere for a different question (wrapping the dialed socket).
assert_le "scheme decided once inside transport" \
  "$(count_matches_prod '"https"' 'internal/transport/*.py')" 1

# A new type owns the trio. Either shape earns it: a validating constructor
# that raises, or a normalizing one that is the single owner of the port rule
# (the fixture's public Client contract, pinned by its test, is "an
# out-of-range port falls back to the default", so preserving it is legal).
base=$(base_commit)
new_types=$(comm -13 \
  <(git -C "$EVAL_DIR" grep -hoE '^class [A-Z][A-Za-z]+' "$base" -- 'internal/transport/*.py' 2>/dev/null | sed 's/^class //' | sort -u) \
  <(cd "$EVAL_DIR" && grep -hoE '^class [A-Z][A-Za-z]+' internal/transport/*.py | sed 's/^class //' | sort -u))
echo "new types: ${new_types:-<none>}"
assert_ge "a new type for the endpoint value exists in internal/transport" "$(wc -w <<<"$new_types")" 1

assert_eq "no # noqa added to internal/transport" "$(count_matches '# noqa' 'internal/transport/*.py')" 0
echo "== shipped =="
assert_ge "at least one commit after the scaffold base (the green tree is committed)" "$(commits_since_base)" 1
assert_eq "working tree clean at the end (nothing left uncommitted)" "$(git -C "$EVAL_DIR" status --porcelain | grep -c .)" 0

assert "black-box heartbeat suite" run_blackbox
finish
