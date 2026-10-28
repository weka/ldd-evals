#!/usr/bin/env bash
# promote-baseline.sh — turn an ignored run directory into a committed baseline.
#
# Copies everything under <run-dir> except the traces into
# baselines/<lang>-<plugin version>-<plugin sha>/, archives every trace.jsonl
# (at any depth) into one traces.tar.zst there (git ignores it: traces can hold
# data from the machine that ran them), records the plugin pin in
# plugin.json, and writes a README stub with the pass-rate table pre-filled
# from each tier's aggregate-result.json unless the run already has a README.
#
# Usage: scripts/promote-baseline.sh <run-dir> <plugin-dir> [lang]
#   <plugin-dir>  the go-linter-driven-development checkout the run measured;
#                 its HEAD and .claude-plugin/plugin.json give sha and version
#   lang          suite name, default go
#   PLUGIN_SHA / PLUGIN_VERSION (env) override what is read from the checkout,
#                 for a run recorded against a plugin state the checkout has moved past
#   BASELINE_NAME (env) overrides the whole directory name. The default
#                 <lang>-<version>-<sha> assumes the plugin and the fixture share a
#                 language; a run of the generic plugin over go-mini is named
#                 generic-gomini-<version>-<sha> instead, and plugin.json records
#                 which plugin was measured either way
#
# Unpack the traces before regrading: zstd -dc traces.tar.zst | tar -xf - -C <baseline>
set -euo pipefail

root=$(cd "$(dirname "$0")/.." && pwd)
run=${1:?usage: promote-baseline.sh <run-dir> <plugin-dir> [lang]}
plugin=${2:?usage: promote-baseline.sh <run-dir> <plugin-dir> [lang]}
lang=${3:-go}

[[ -d $run ]] || { echo "promote-baseline: run dir not found: $run" >&2; exit 2; }
for tool in jq zstd rsync tar; do
  command -v "$tool" >/dev/null || { echo "promote-baseline: $tool is required" >&2; exit 2; }
done

sha=${PLUGIN_SHA:-$(git -C "$plugin" rev-parse --short=7 HEAD)}
version=${PLUGIN_VERSION:-$(jq -r .version "$plugin/.claude-plugin/plugin.json")}
plugin_name=$(jq -r .name "$plugin/.claude-plugin/plugin.json")
name=${BASELINE_NAME:-"$lang-$version-$sha"}
dest="$root/baselines/$name"
[[ -e $dest ]] && { echo "promote-baseline: $dest already exists" >&2; exit 1; }

mkdir -p "$dest"
rsync -a --exclude=trace.jsonl "$run/" "$dest/"
traces=$(cd "$run" && find . -type f -name trace.jsonl | sort)
if [[ -n $traces ]]; then
  (cd "$run" && printf '%s\n' "$traces" | tar -cf - -T -) | zstd -q -19 -T0 -o "$dest/traces.tar.zst"
fi
jq -n --arg lang "$lang" --arg plugin "$plugin_name" --arg version "$version" --arg sha "$sha" \
  '{lang: $lang, plugin: $plugin, plugin_repo: "weka/linter-driven-development", plugin_version: $version, plugin_sha: $sha}' \
  > "$dest/plugin.json"

if [[ ! -f $dest/README.md ]]; then
  {
    echo "# Baseline $name"
    echo
    echo "Plugin \`$plugin_name\` from \`weka/linter-driven-development\` at $sha (v$version). Unpack the traces before"
    echo "regrading: \`zstd -dc traces.tar.zst | tar -xf - -C .\` from this directory. The archive is not committed."
    for agg in "$dest"/*/aggregate-result.json; do
      [[ -f $agg ]] || continue
      tier=$(basename "$(dirname "$agg")")
      echo
      echo "## $tier"
      echo
      echo "| Case | Passed | Cost |"
      echo "|---|---|---|"
      jq -r '.cases[] | "| \(.name) | \(.passed)/\(.runs) | $\(([.results[].cost_usd] | add) * 100 | round / 100) |"' "$agg"
      jq -r '"\nTier pass rate \(.aggregates.passRate * 100 | round / 100), total cost $\(.aggregates.totalCostUSD * 100 | round / 100)."' "$agg"
    done
  } > "$dest/README.md"
fi

echo "promote-baseline: $dest ($(printf '%s\n' "$traces" | grep -c . || true) traces archived)"
