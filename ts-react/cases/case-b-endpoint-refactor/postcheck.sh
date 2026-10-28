#!/usr/bin/env bash
# Case B postcheck: behavior preserved, lint green, one owner for the port
# range, a new type owning the trio in transport, no suppressions.
set -uo pipefail
here="$(dirname "$(readlink -f "$0")")"
# postcheck/lib.sh is two levels up in this repository (ts-react/cases/<case>/) and
# one level up when the suite is copied under <plugin>/evals/ for a run.
for lib in "$here/../../postcheck/lib.sh" "$here/../postcheck/lib.sh"; do
  [ -f "$lib" ] && { . "$lib"; break; }
done

assert "task test green" run_task test
assert "task lint green" run_task lint

assert_le "port range predicate (65535 or a named max port) has one owner" \
  "$(count_matches_prod '(<|>) ?(65535|[a-zA-Z_.]*[mM]ax[A-Za-z_]*[Pp]ort[A-Za-z_]*)\b' 'src/services/transport/*.ts')" 1
# The scheme is chosen wherever 'https' is spelled; the TLS flag may still be
# consulted elsewhere for a different question.
assert_le "scheme decided once inside transport" \
  "$(count_matches_prod "'https'" 'src/services/transport/*.ts')" 1

# A new type owns the trio. Either shape earns it: a validating constructor
# that throws, or a normalizing one that is the single owner of the port rule
# (the fixture's public client contract, pinned by its test, is "an
# out-of-range port falls back to the default", so preserving it is legal).
new_types=$(new_type_names 'src/services/transport/*.ts')
echo "new types: ${new_types:-<none>}"
assert_ge "a new type for the endpoint value exists in src/services/transport" "$(wc -w <<<"$new_types")" 1

assert_eq "no suppression added to src/services/transport" "$(count_suppressions 'src/services/transport/*.ts')" 0
echo "== shipped =="
assert_ge "at least one commit after the scaffold base (the green tree is committed)" "$(commits_since_base)" 1
assert_eq "working tree clean at the end (nothing left uncommitted)" "$(git -C "$EVAL_DIR" status --porcelain | grep -c .)" 0

assert "black-box heartbeat suite" run_blackbox
finish
