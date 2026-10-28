#!/usr/bin/env bash
# sync-neutral-graders.sh — fill each *-neutral case's graders/ from its twin,
# keeping only the plugin-neutral graders, so the old-vs-new A/B
# (cases/NEUTRAL.md) grades both plugins on the same assertions. Re-runnable
# and run by `task ts-react:graders` after gen-review-graders.sh, because the
# review-full twin's recall-*/precision-* graders are generated.
#
# A grader is copied when it is a `regex` grader whose file name and pattern
# carry nothing the hand-written 1.x plugin never promised: no rule id
# (R1–R12, Q<n>), no cluster or Container, no skeptic verdict, no Stop check,
# no report banner, category emoji or Fix-pattern move name. What survives are
# the file-anchor graders (`config\.ts:[0-9]+`, the generated recall-*, the
# precision-* that read a file or symbol) and the symbol graders (`baseUrl`,
# `primaryFound`, `ReplicaCount`, the section markers). tool_used and llm
# graders are never copied: the prompt forbids nothing and judges nothing.
#
# Usage: cases/sync-neutral-graders.sh      (from anywhere)
set -euo pipefail

here=$(cd "$(dirname "$0")" && pwd)

# Names a grader is dropped on sight for; the pattern filter below catches the rest.
NAME_SKIP='^(cluster-|fix-|skeptic-|stop-check|rule-cited|no-edit|no-write|no-multiedit|critic-|judge-|hunters-|report-header|bugs-section|traceid-|replica-count-is-ceremony|cheaper-alternative)'
# Words in a grader's `pattern:` line that name the plugin's protocol rather than
# the plant. The pattern is tested with its `\b` tokens removed, so `\bR1\b`
# reads as R1; the rule and question ids are matched as whole tokens.
CONTENT_SKIP='(^|[^A-Za-z0-9_])R(1[0-2]|[1-9])([^A-Za-z0-9_]|$)|(^|[^A-Za-z0-9_])Q[0-9]|[Cc]luster|Container|CONFIRMED|REFUTED|Stop check|CODE REVIEW|Readiness|POLISH|Domain Type|Parameter Object|Leaf Type|Collection Type|Clean Island|Push the Global|Null Object|Failure from Absence|Name enum strings|skeptic|hunter|critic|\xf0\x9f\x90\x9b|\xf0\x9f\x94\xb4|\xf0\x9f\x9f\xa1|\xf0\x9f\x9f\xa2|\xf0\x9f\x94\x97'

neutral_of() { # twin dir -> neutral dir name
  case "$1" in
  review-full) echo review-full-neutral ;;
  *-review) echo "$1-neutral" ;;
  esac
}

total=0
for twin in review-full case-a-retention-review case-b-endpoint-review case-c-picker-review \
  case-d-ceremony-review case-e-nils-review case-f-globals-review centerpiece-storify-review; do
  neutral=$(neutral_of "$twin")
  src="$here/$twin/graders" dst="$here/$neutral/graders"
  [[ -d "$here/$neutral" ]] || { echo "sync-neutral-graders: $neutral missing" >&2; exit 1; }
  rm -rf "$dst" && mkdir -p "$dst"
  n=0
  for f in "$src"/*.md; do
    name=$(basename "$f")
    [[ "$name" =~ $NAME_SKIP ]] && continue
    grep -qE '^type: regex' "$f" || continue
    pattern=$(grep -E '^pattern:' "$f" | sed 's/\\b//g')
    grep -qE -- "$CONTENT_SKIP" <<<"$pattern" && continue
    cp "$f" "$dst/$name"
    n=$((n + 1))
  done
  echo "sync-neutral-graders: $neutral ← $n of $(ls "$src"/*.md | wc -l | tr -d ' ') graders from $twin"
  total=$((total + n))
done
echo "sync-neutral-graders: $total graders in 8 neutral cases"
