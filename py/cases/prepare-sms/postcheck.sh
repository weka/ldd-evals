#!/usr/bin/env bash
# prepare-sms postcheck — runs in the kept scaffold after /{{cmd_prefix}}-prepare.
#   1. ≥1 prep commit on top of the scaffold's base commit
#   2. no SMS code landed in production modules (prep reshapes; it never builds the feature)
#   3. task test green after prep
#   4. the god file is either untouched or explicitly reported PREP-DEFERRED
set -uo pipefail
here="$(dirname "$(readlink -f "${BASH_SOURCE[0]}")")"
# postcheck/lib.sh is two levels up in this repository (py/cases/<case>/) and one
# level up when the suite is copied under <plugin>/evals/ for a run.
for lib in "$here/../../postcheck/lib.sh" "$here/../postcheck/lib.sh"; do
  [ -f "$lib" ] && { . "$lib"; break; }
done

assert_ge "prep commits after the scaffold base" "$(commits_since_base)" 1
if [[ -n "$(git -C "$EVAL_DIR" status --porcelain --untracked-files=all)" ]]; then
	echo "info  working tree has uncommitted changes (prep work must land as commits):"
	git -C "$EVAL_DIR" status --porcelain --untracked-files=all | head -n 20
fi

sms=$(cd "$EVAL_DIR" && grep -rlE '[Ss][Mm][Ss]' --include='*.py' --exclude='test_*.py' --exclude-dir=.git . || true)
[[ -n "$sms" ]] && printf 'info  SMS symbols found in: %s\n' "$sms"
assert "no SMS feature code in production modules" test -z "$sms"

assert "task test green after prep" run_task test

god=internal/services/device_service.py
if file_unchanged_since_base "$god"; then
	echo "PASS  $god untouched"
else
	assert "$god changed, so the PREPARATION LOG must report PREP-DEFERRED" \
		last_message_contains 'PREP-DEFERRED'
fi

finish
