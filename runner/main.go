// Command ldd-eval runs the linter-driven-development plugins' behavioral
// eval cases over headless `claude -p` and grades the traces. It mirrors the
// `claude plugin eval` case format so the cases outlive this runner.
package main

import (
	"os"

	"github.com/buzzdan/ldd-evals/runner/internal/cli"
)

func main() {
	os.Exit(cli.Run(os.Args[1:], os.Stdout, os.Stderr))
}
