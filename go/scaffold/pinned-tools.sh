#!/usr/bin/env bash
# Source this file from a go-mini scaffold script after the base commit.
#
# seed_pinned_tools <dest> — puts the fixture's pinned golangci-lint in
# <dest>/.bin. The fixture's `task lint` installs it once into a per-user
# folder (and fetches the Go toolchain the tasks run on). Each scaffold gets
# its own copy, a copy-on-write clone where the file system can, so an agent
# that writes to its .bin cannot change the next run's tool. The fixture's
# .gitignore keeps .bin out of git. The lint result is not checked here: the
# red-lint scaffold is red on purpose.

seed_pinned_tools() {
	local dest=$1 tools="${XDG_CACHE_HOME:-$HOME/.cache}/ldd-evals/go-tools" version tool toolchain
	version=$(sed -n 's/^  GOLANGCI_LINT_VERSION: *//p' "$dest/Taskfile.yaml")
	tool="golangci-lint-$version"
	mkdir -p -m 700 "$tools" && mkdir -p "$dest/.bin"
	if [[ ! -x "$tools/$tool" ]]; then
		task --dir "$dest" lint BIN_DIR="$tools" >/dev/null 2>&1 || true
	fi
	# Fetch the Go toolchain the tasks run on, also when the binary is cached.
	# Without it no task can run, so the scaffold fails before the agent starts.
	toolchain=$(sed -n 's/^  GO_TOOLCHAIN: *//p' "$dest/Taskfile.yaml")
	if ! GOTOOLCHAIN="$toolchain" go version >/dev/null 2>&1; then
		echo "scaffold: could not fetch the Go toolchain $toolchain" >&2
		return 1
	fi
	if [[ ! -x "$tools/$tool" ]]; then
		echo "scaffold: could not install $tool into $tools" >&2
		return 1
	fi
	cp -c "$tools/$tool" "$dest/.bin/$tool" 2>/dev/null ||
		cp --reflink=auto "$tools/$tool" "$dest/.bin/$tool" 2>/dev/null ||
		cp "$tools/$tool" "$dest/.bin/$tool"
}
