#!/usr/bin/env bash
# quickfix-clean-tree postcheck: the scaffold is untouched — no commit, no dirty file.
set -uo pipefail
here="$(dirname "$(readlink -f "$0")")"
# postcheck/lib.sh is two levels up in this repository (py/cases/<case>/) and one
# level up when the suite is copied under <plugin>/evals/ for a run.
for lib in "$here/../../postcheck/lib.sh" "$here/../postcheck/lib.sh"; do
  [ -f "$lib" ] && { . "$lib"; break; }
done

assert_eq "no commit after the scaffold base" "$(commits_since_base)" 0
assert_eq "working tree clean (nothing edited)" "$(git -C "$EVAL_DIR" status --porcelain | grep -c .)" 0
finish
