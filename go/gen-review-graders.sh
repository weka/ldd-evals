#!/usr/bin/env bash
# gen-review-graders.sh — derive the review-full case's recall and precision
# graders from violations.yaml, so the manifest stays the single source.
#
#   recall-<id>.md     one per distinct file set among plants that carry an
#                      expect.review: the report must mention at least one of
#                      the plant's files by basename. Plants sharing the same
#                      file set share one grader (a basename regex cannot tell
#                      them apart anyway); the covered ids are listed as a YAML
#                      comment inside the grader. An entry may carry
#                      `recall_match: '<ERE>'` to replace the basename pattern
#                      of its file set when reports name the plant another way
#                      (by its symbol, say).
#                      An entry may instead carry `recall_own: '<ERE>'`: it
#                      then leaves its file set's grader and gets a grader of
#                      its own with that pattern, for a plant whose file name
#                      alone cannot prove it was found (a god file, named in
#                      every report for other reasons).
#   cluster-<slug>.md  one per distinct expect.review.cluster anchor: a
#                      cluster entry naming that anchor must appear. The default
#                      pattern accepts the anchor — or, for a dotted anchor such
#                      as `Device.Status`, its last segment alone — either on a
#                      line carrying the word "cluster" (any case) or at the
#                      start of a bullet within eight lines below a "cluster(s)"
#                      header: reports write `CLUSTER: Status`, `CLUSTER:
#                      Device.Status` and `**Clusters**` followed by
#                      `- **Device.Status** — R1, R11` alike.
#                      An entry may carry `cluster_match: '<ERE>'` to replace
#                      that default when reports spell the cluster in more
#                      than one way.
#   precision-<id>.md  one per control WITHOUT `mention_ok: true`: the control's
#                      `symbol:` regex must not appear anywhere in the report.
#                      A control that a correct report legitimately mentions
#                      (ParseRegion as the reuse target, errors.Is as a fix, …)
#                      opts out with mention_ok; a control lacking `symbol:`
#                      fails the generator so the manifest stays complete.
#                      A control with `precision: finding` keeps its grader but
#                      draws the line elsewhere: the report may name the symbol
#                      (as the existing type to wire in, say) and fails only when
#                      one of the control's files is cited as a finding location,
#                      `file.py:NN` with a line number, in a row whose next column
#                      names the control's rule. Reports write a finding as
#                      `location | rule question: evidence | fix | size`; a bare
#                      path or a symbol in the prose is a reference, and a row
#                      under another rule (the comment critic rewriting a
#                      docstring in the same file) is that rule's business. A row
#                      that leaves the rule id to its section header escapes this
#                      grader, so the mode is lenient by design.
#
# Usage: gen-review-graders.sh [violations.yaml] [graders-dir]
# Re-runnable: previously generated recall-/cluster-/precision- files are
# removed first; hand-written graders in the same dir are left alone.
set -euo pipefail

here=$(cd "$(dirname "$0")" && pwd)
manifest="${1:-$here/violations.yaml}"
out="${2:-$here/cases/review-full/graders}"

[[ -f "$manifest" ]] || { echo "manifest not found: $manifest" >&2; exit 2; }
mkdir -p "$out"
find "$out" -maxdepth 1 -type f \( -name 'recall-*.md' -o -name 'cluster-*.md' -o -name 'precision-*.md' \) -delete

# One record per entry, fields joined by the ASCII unit separator (\x1f) — a
# non-whitespace IFS keeps empty fields in place, where tabs would collapse:
#   id  control  basenames(space-sep)  has_review  cluster  symbol  mention_ok  cluster_match  recall_match  precision_mode  rule  recall_own
records=$(awk '
  function flush() {
    if (id != "") printf "%s\037%s\037%s\037%s\037%s\037%s\037%s\037%s\037%s\037%s\037%s\037%s\n", id, control, files, review, cluster, symbol, mok, cmatch, rmatch, pmode, rule, rown
    id = ""; control = "false"; files = ""; review = "0"; cluster = ""; symbol = ""; mok = "false"; cmatch = ""; rmatch = ""; pmode = "mention"; rule = ""; rown = ""
  }
  /^- id:[[:space:]]*/ { flush(); id = $0; sub(/^- id:[[:space:]]*/, "", id); sub(/[[:space:]].*$/, "", id); next }
  id == "" { next }
  /^[[:space:]]+control:[[:space:]]*true/ { control = "true"; next }
  /^[[:space:]]+mention_ok:[[:space:]]*true/ { mok = "true"; next }
  /^[[:space:]]+precision:[[:space:]]*finding/ { pmode = "finding"; next }
  /^[[:space:]]+rule:[[:space:]]*/ { rule = $0; sub(/^[[:space:]]+rule:[[:space:]]*/, "", rule); sub(/[[:space:]].*$/, "", rule); next }
  /^[[:space:]]+files:[[:space:]]*\[/ {
    f = $0; sub(/^[[:space:]]+files:[[:space:]]*\[/, "", f); sub(/\].*$/, "", f)
    n = split(f, parts, /,[[:space:]]*/); files = ""
    for (i = 1; i <= n; i++) { b = parts[i]; gsub(/[[:space:]]/, "", b); sub(/.*\//, "", b); files = files (i > 1 ? " " : "") b }
    next
  }
  /^[[:space:]]+symbol:[[:space:]]*'\''/ {
    symbol = $0; sub(/^[[:space:]]+symbol:[[:space:]]*'\''/, "", symbol); sub(/'\''[[:space:]]*(#.*)?$/, "", symbol); next
  }
  /^[[:space:]]+cluster_match:[[:space:]]*'\''/ {
    cmatch = $0; sub(/^[[:space:]]+cluster_match:[[:space:]]*'\''/, "", cmatch); sub(/'\''[[:space:]]*(#.*)?$/, "", cmatch); next
  }
  /^[[:space:]]+recall_match:[[:space:]]*'\''/ {
    rmatch = $0; sub(/^[[:space:]]+recall_match:[[:space:]]*'\''/, "", rmatch); sub(/'\''[[:space:]]*(#.*)?$/, "", rmatch); next
  }
  /^[[:space:]]+recall_own:[[:space:]]*'\''/ {
    rown = $0; sub(/^[[:space:]]+recall_own:[[:space:]]*'\''/, "", rown); sub(/'\''[[:space:]]*(#.*)?$/, "", rown); next
  }
  /^[[:space:]]+review:/ || /^[[:space:]]+expect:[[:space:]]*\{[[:space:]]*review/ {
    review = "1"
    if (match($0, /cluster: "[^"]+"/)) { cluster = substr($0, RSTART + 10, RLENGTH - 11) }
    next
  }
  END { flush() }
' "$manifest")

# escape_re <basename> — a literal file name as an ERE fragment.
escape_re() { printf '%s' "$1" | sed -e 's/[.[\*^$+?(){}|\\]/\\&/g'; }
# slug <anchor> — a cluster anchor as a file-name fragment.
slug() { printf '%s' "$1" | tr 'A-Z' 'a-z' | sed -e 's/[^a-z0-9]+/-/g' -e 's/[^a-z0-9]/-/g' -e 's/^-//' -e 's/-$//'; }

declare -A recall_ids recall_first recall_match
declare -A clusters cluster_match
n_recall=0 n_cluster=0 n_precision=0 missing_symbol=0

while IFS=$'\x1f' read -r id control files review cluster symbol mok cmatch rmatch pmode rule rown; do
  [[ -n "$id" ]] || continue
  if [[ "$control" == "true" ]]; then
    [[ "$mok" == "true" ]] && continue
    if [[ -z "$symbol" ]]; then
      echo "control $id has no symbol: (add symbol: '…' or mention_ok: true)" >&2
      missing_symbol=1
      continue
    fi
    if [[ "$pmode" == "finding" ]]; then
      # A finding location is file.py:NN (or file.go:NN) in the first column of a
      # row whose second column names the control's rule. The character class in
      # front keeps test_tenant.py from matching tenant.py.
      pat=""
      for b in $files; do pat="${pat}${pat:+|}$(escape_re "$b")"; done
      pattern="(?:^|[^A-Za-z0-9_])(?:$pat):[0-9][^\n|]*\|[^\n|]*\b$rule\b"
      note="# control $id: healthy code that must draw no finding. A correct report may
# name its symbol (as the existing type to wire in, say); it fails only when one of
# its files is cited as a finding location, file:line, in a row that names $rule
# (precision: finding)."
    else
      pattern="$symbol"
      note="# control $id: healthy code that must draw no finding; its symbol must not
# appear anywhere in the report (a mention IS the false positive)."
    fi
    cat > "$out/precision-$id.md" <<EOF
---
$note
type: regex
pattern: '$pattern'
match: not_contains
target: last_message
---
EOF
    n_precision=$((n_precision + 1))
    continue
  fi
  [[ "$review" == "1" ]] || continue
  if [[ -n "$rown" ]]; then
    cat > "$out/recall-$id.md" <<EOF
---
# recall: the report names this plant the way its recall_own names it.
# ids: $id
type: regex
pattern: '$rown'
match: contains
target: last_message
---
EOF
    n_recall=$((n_recall + 1))
    continue
  fi
  pat=""
  for b in $files; do
    pat="${pat}${pat:+|}$(escape_re "$b")"
  done
  [[ -n "$pat" ]] || continue
  if [[ -z "${recall_first[$pat]:-}" ]]; then
    recall_first[$pat]="$id"
    recall_ids[$pat]="$id"
  else
    recall_ids[$pat]="${recall_ids[$pat]}, $id"
  fi
  [[ -n "$rmatch" ]] && recall_match[$pat]="$rmatch"
  if [[ -n "$cluster" ]]; then
    clusters[$cluster]="${clusters[$cluster]:-}${clusters[$cluster]:+, }$id"
    [[ -n "$cmatch" ]] && cluster_match[$cluster]="$cmatch"
  fi
done <<< "$records"

(( missing_symbol == 0 )) || exit 1

for pat in "${!recall_first[@]}"; do
  id="${recall_first[$pat]}"
  ids="${recall_ids[$pat]}"
  case "$pat" in *'|'*) pattern="($pat)" ;; *) pattern="$pat" ;; esac
  note="by basename."
  if [[ -n "${recall_match[$pat]:-}" ]]; then
    pattern="${recall_match[$pat]}"
    note="by basename or by the spelling recall_match names."
  fi
  cat > "$out/recall-$id.md" <<EOF
---
# recall: the report names at least one file of this plant $note
# ids: $ids
type: regex
pattern: '$pattern'
match: contains
target: last_message
---
EOF
  n_recall=$((n_recall + 1))
done

for anchor in "${!clusters[@]}"; do
  s=$(slug "$anchor")
  esc=$(escape_re "$anchor")
  leaf="${anchor##*.}"
  if [[ "$leaf" != "$anchor" ]]; then
    names="($esc|$(escape_re "$leaf"))"
  else
    names="$esc"
  fi
  # Default: the anchor on a line that carries the word "cluster" (CLUSTER: \`Device.Status\`),
  # or at the start of a bullet within eight lines below a "cluster(s)" header
  # (**Clusters** followed by "- **Device.Status** — R1, R11"). The anchor is
  # matched without regard to case: reports title a lower-case manifest anchor
  # such as "retention" as "CLUSTER: Retention".
  default_pattern="(?i:\\bcluster\\b)[^\\n]*\\b(?i:$names)\\b|(?i:\\bclusters?\\b)[^\\n]*(?:\\n[^\\n]*){0,8}?\\n[ \\t]*(?:[-*•]|[0-9]+[.)])[ \\t]*\\**\x60?(?i:$names)\\b"
  pattern="${cluster_match[$anchor]:-$default_pattern}"
  cat > "$out/cluster-$s.md" <<EOF
---
# cluster: ≥2 hunters converge on "$anchor"; the report must render a
# 🔗 CLUSTER entry naming it (by the anchor or its last segment).
# members: ${clusters[$anchor]}
type: regex
pattern: '$pattern'
match: contains
target: last_message
---
EOF
  n_cluster=$((n_cluster + 1))
done

echo "gen-review-graders: $n_recall recall, $n_cluster cluster, $n_precision precision graders → $out"
