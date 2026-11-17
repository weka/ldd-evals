#!/usr/bin/env bash
# Source this file from a go-mini scaffold script after the base commit.
#
# seed_pinned_tools <dest> — puts the fixture's pinned golangci-lint in
# <dest>/.bin. The fixture's `task lint` installs it once into a shared folder
# under ${TMPDIR:-/tmp} (and fetches the Go toolchain the lint runs on); each
# scaffold then gets a hard link, or a copy across file systems. The fixture's
# .gitignore keeps .bin out of git. The lint result is not checked here: the
# red-lint scaffold is red on purpose.

seed_pinned_tools() {
	local dest=$1 tools="${TMPDIR:-/tmp}/ldd-evals-go-tools" version tool
	version=$(sed -n 's/^  GOLANGCI_LINT_VERSION: *//p' "$dest/Taskfile.yaml")
	tool="golangci-lint-$version"
	mkdir -p "$tools" "$dest/.bin"
	if [[ ! -x "$tools/$tool" ]]; then
		task --dir "$dest" lint BIN_DIR="$tools" >/dev/null 2>&1 || true
	fi
	if [[ ! -x "$tools/$tool" ]]; then
		echo "scaffold: could not install $tool into $tools" >&2
		return 1
	fi
	ln -f "$tools/$tool" "$dest/.bin/$tool" 2>/dev/null || cp -f "$tools/$tool" "$dest/.bin/$tool"
}
