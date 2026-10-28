#!/usr/bin/env bash
# Scaffold a tiny Go-only repository into <dest>: no pyproject.toml, no .py
# files. The trigger-non-py case checks that "implement X" here does NOT start
# the {{cmd_prefix}} workflow.
#
# Usage: trigger-non-py/scaffold.sh <dest-dir>
set -euo pipefail

dest="${1:?usage: scaffold.sh <dest-dir>}"
mkdir -p "$dest/cmd/app"
cat > "$dest/go.mod" <<'MOD'
module example.com/go-tiny

go 1.24
MOD
cat > "$dest/cmd/app/main.go" <<'GO'
// Command app is a minimal HTTP service serving /healthz.
package main

import (
	"log"
	"net/http"
)

func main() {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /healthz", func(w http.ResponseWriter, _ *http.Request) {
		_, _ = w.Write([]byte("ok\n"))
	})
	log.Fatal(http.ListenAndServe(":8080", mux))
}
GO
cat > "$dest/README.md" <<'MD'
# go-tiny

A minimal HTTP service.

- `go run ./cmd/app` — serve on :8080
- `go test ./...` — run the tests
MD
cd "$dest"
git init -q
git -c user.name=fixture -c user.email=fixture@example.com add -A
git -c user.name=fixture -c user.email=fixture@example.com commit -q -m "go-tiny: initial import"
echo "scaffolded go-tiny at $dest ($(git rev-parse --short HEAD))"
