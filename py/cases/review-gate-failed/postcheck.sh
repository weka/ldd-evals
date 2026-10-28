#!/usr/bin/env bash
# review-gate-failed postcheck — the case measures the review's fallback only
# while two things hold, and both are checked against the plugin's own gate:
#   1. with CHECK_REPO_BRAIN_FAULT set, the gate fails (exit 2);
#   2. without it, the gate finds the three plants (exit 1 with [Q1], [Q2] and
#      [Q3] lines), so the review's findings are the gate's questions answered
#      by reading.
set -uo pipefail
here="$(dirname "$(readlink -f "${BASH_SOURCE[0]}")")"
# postcheck/lib.sh is two levels up in this repository (py/cases/<case>/) and one
# level up when the suite is copied under <plugin>/evals/ for a run.
for lib in "$here/../../postcheck/lib.sh" "$here/../postcheck/lib.sh"; do
	[ -f "$lib" ] && { . "$lib"; break; }
done
plugin_root="$(cd "$here/../.." && pwd)"
gate="$plugin_root/scripts/check-repo-brain.sh"

out=$(cd "$EVAL_DIR" && CHECK_REPO_BRAIN_FAULT=postcheck bash "$gate" . 2>&1)
rc=$?
echo "info  gate with CHECK_REPO_BRAIN_FAULT: exit $rc"
printf '%s\n' "$out" | tail -2 | sed 's/^/      /'
fault_fails() { [[ "$rc" == 2 ]]; }
assert "CHECK_REPO_BRAIN_FAULT makes the plugin's gate fail (exit 2)" fault_fails

report=$(cd "$EVAL_DIR" && env -u CHECK_REPO_BRAIN_FAULT bash "$gate" . 2>&1)
rc=$?
echo "info  gate without the variable: exit $rc"
printf '%s\n' "$report" | sed 's/^/      /'
finds() { [[ "$rc" == 1 ]] && printf '%s\n' "$report" | grep -qF -- "$1"; }
assert "the gate finds the orphan doc ([Q1] docs/retention.md)" finds "[Q1] docs/retention.md"
assert "the gate finds the unresolved symbol ([Q2] docs/store.md)" finds "[Q2] docs/store.md"
assert "the gate finds the unwired root ([Q3])" finds "[Q3]"

finish
