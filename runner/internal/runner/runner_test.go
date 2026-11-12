package runner_test

import (
	"context"
	"errors"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"github.com/weka/ldd-evals/runner/internal/report"
	"github.com/weka/ldd-evals/runner/internal/runner"
)

const regexGrader = "---\ntype: regex\npattern: 'Findings'\n---\n"

const promptWithModel = "---\nname: probe\nruns: 1\nmodel: claude-opus-4-1\ntimeout_seconds: 1\n---\nGo.\n"

// fakeClaude installs script as `claude` ahead of everything else on PATH
// (the rest of PATH stays so scaffold scripts keep coreutils).
func fakeClaude(t *testing.T, script string) {
	t.Helper()
	bin := t.TempDir()
	if err := os.WriteFile(filepath.Join(bin, "claude"), []byte(script), 0o755); err != nil {
		t.Fatalf("write fake claude: %v", err)
	}
	t.Setenv("PATH", bin+string(os.PathListSeparator)+os.Getenv("PATH"))
}

// catTrace is a fake claude that streams the given trace text.
func catTrace(t *testing.T, traceText string) {
	t.Helper()
	path := filepath.Join(t.TempDir(), "trace.jsonl")
	if err := os.WriteFile(path, []byte(traceText), 0o644); err != nil {
		t.Fatalf("write trace: %v", err)
	}
	fakeClaude(t, "#!/bin/bash\ncat "+path+"\n")
}

// evalsWithCase builds a temp evals dir holding one case `probe` and a
// scaffold script with the given body.
func evalsWithCase(t *testing.T, scaffoldBody string, files map[string]string) string {
	t.Helper()
	evalsDir := t.TempDir()
	if err := os.MkdirAll(filepath.Join(evalsDir, "scaffold"), 0o755); err != nil {
		t.Fatalf("mkdir: %v", err)
	}
	if err := os.WriteFile(filepath.Join(evalsDir, "scaffold", "default.sh"), []byte("#!/bin/bash\n"+scaffoldBody), 0o755); err != nil {
		t.Fatalf("write scaffold: %v", err)
	}
	for rel, content := range files {
		path := filepath.Join(evalsDir, "probe", rel)
		if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
			t.Fatalf("mkdir: %v", err)
		}
		if err := os.WriteFile(path, []byte(content), 0o644); err != nil {
			t.Fatalf("write %s: %v", rel, err)
		}
	}
	return evalsDir
}

func runProbe(t *testing.T, opts runner.Options) (report.Aggregate, report.RunResult) {
	t.Helper()
	opts.PluginDir = filepath.Dir(opts.EvalsDir)
	r, err := runner.New(opts)
	if err != nil {
		t.Fatalf("New: %v", err)
	}
	agg, err := r.Run(context.Background())
	if err != nil {
		t.Fatalf("Run: %v", err)
	}
	if len(agg.Cases) != 1 || len(agg.Cases[0].Results) != 1 {
		t.Fatalf("aggregate = %+v, want one case with one run", agg)
	}
	return agg, agg.Cases[0].Results[0]
}

func TestRunner_ScaffoldFailureIsRecordedNotFatal(t *testing.T) {
	fakeClaude(t, "#!/bin/bash\necho 'must not run' >&2; exit 9\n")
	evalsDir := evalsWithCase(t, "echo 'disk full' >&2\nexit 7\n", map[string]string{"prompt.md": promptWithModel, "graders/g.md": regexGrader})
	now := time.Date(2026, 9, 8, 10, 15, 0, 0, time.UTC)
	r, err := runner.New(runner.Options{EvalsDir: evalsDir, PluginDir: filepath.Dir(evalsDir), Threshold: 1, Now: now})
	if err != nil {
		t.Fatalf("New: %v", err)
	}
	if want := filepath.Join(evalsDir, "results", "20260908-101500"); r.OutDir() != want {
		t.Errorf("default OutDir = %q, want %q", r.OutDir(), want)
	}
	agg, err := r.Run(context.Background())
	if err != nil {
		t.Fatalf("Run: %v", err)
	}
	res := agg.Cases[0].Results[0]
	if res.Passed || len(res.Graders) != 0 || !strings.Contains(res.Error, "scaffold") || !strings.Contains(res.Error, "disk full") {
		t.Errorf("result = %+v, want a scaffold error and no graders", res)
	}
	if res.Model != "claude-opus-4-1" {
		t.Errorf("Model = %q, want the case's model when no flag is given", res.Model)
	}
	if !r.Threshold().Met(agg) == false {
		t.Error("a failed run must not meet the threshold")
	}
}

func TestRunner_IncompleteTraceIsAnExecutionError(t *testing.T) {
	catTrace(t, `{"type":"assistant","message":{"content":[{"type":"text","text":"Findings: none"}]}}`+"\n")
	evalsDir := evalsWithCase(t, "mkdir -p \"$1\"\n", map[string]string{"prompt.md": promptWithModel, "graders/g.md": regexGrader})
	_, res := runProbe(t, runner.Options{EvalsDir: evalsDir, OutDir: t.TempDir(), Threshold: 1, Model: "flag-model"})
	if res.Passed || len(res.Graders) != 0 || !strings.Contains(res.Error, "no result event") {
		t.Errorf("result = %+v, want an incomplete-trace error", res)
	}
	if res.Model != "flag-model" || res.CostUSD != 0 {
		t.Errorf("Model/CostUSD = %q/%v, want flag-model/0", res.Model, res.CostUSD)
	}
}

func TestRunner_IsErrorResultAddsExecutionGraderButStillGrades(t *testing.T) {
	catTrace(t, strings.Join([]string{
		`{"type":"assistant","message":{"content":[{"type":"text","text":"Findings: R3 | x.go:1 | y"}]}}`,
		`{"type":"result","subtype":"error_max_turns","is_error":true,"result":"","total_cost_usd":0.2,"duration_ms":9,"num_turns":10}`,
	}, "\n"))
	evalsDir := evalsWithCase(t, "mkdir -p \"$1\"\n", map[string]string{"prompt.md": promptWithModel, "graders/g.md": regexGrader})
	agg, res := runProbe(t, runner.Options{EvalsDir: evalsDir, OutDir: t.TempDir(), Threshold: 1})
	if res.Passed || res.Error != "" || len(res.Graders) != 2 {
		t.Fatalf("result = %+v, want execution + regex graders and no infrastructure error", res)
	}
	if res.Graders[0].Name != "execution" || res.Graders[0].Passed || !strings.Contains(res.Graders[0].Detail, "error_max_turns") {
		t.Errorf("execution grader = %+v", res.Graders[0])
	}
	if res.Graders[1].Name != "g" || !res.Graders[1].Passed {
		t.Errorf("regex grader should still run over the assistant text: %+v", res.Graders[1])
	}
	if res.CostUSD != 0.2 || res.NumTurns != 10 || agg.Aggregates.TotalCostUSD != 0.2 {
		t.Errorf("counters = %+v / %+v", res, agg.Aggregates)
	}
}

func TestRunner_TimeoutKillsClaude(t *testing.T) {
	fakeClaude(t, "#!/bin/bash\nsleep 30\n")
	evalsDir := evalsWithCase(t, "mkdir -p \"$1\"\n", map[string]string{"prompt.md": promptWithModel, "graders/g.md": regexGrader})
	start := time.Now()
	_, res := runProbe(t, runner.Options{EvalsDir: evalsDir, OutDir: t.TempDir(), Threshold: 1})
	if elapsed := time.Since(start); elapsed > 25*time.Second {
		t.Errorf("run took %v; the 1s timeout and the grace after SIGINT did not kill the agent", elapsed)
	}
	if res.Passed || res.CostUSD != 0 || !strings.Contains(res.Error, "timed out") || !strings.Contains(res.Error, "cost is not counted") {
		t.Errorf("result = %+v, want a timeout error that says the cost is not counted", res)
	}
}

// promptWithTimeout3 gives a fake claude time to install its SIGINT trap before
// the timeout.
const promptWithTimeout3 = "---\nname: probe\nruns: 1\nmodel: claude-opus-4-1\ntimeout_seconds: 3\n---\nGo.\n"

// interruptibleClaude is a fake claude that starts a tool child, writes its pid
// to $CHILD_PID_FILE, and on SIGINT writes a result event with a cost and
// exits, as claude -p does when it is interrupted.
const interruptibleClaude = `#!/bin/bash
trap 'echo "{\"type\":\"result\",\"subtype\":\"error_during_execution\",\"is_error\":true,\"total_cost_usd\":0.42,\"duration_ms\":900,\"num_turns\":7}"; exit 130' INT
echo '{"type":"assistant","message":{"content":[{"type":"text","text":"Findings: R3 | x.go:1 | y"}]}}'
sleep 30 &
echo $! > "$CHILD_PID_FILE"
wait $!
`

func TestRunner_TimeoutKeepsTheCostOfTheInterruptedRun(t *testing.T) {
	fakeClaude(t, interruptibleClaude)
	childPIDFile := filepath.Join(t.TempDir(), "child.pid")
	t.Setenv("CHILD_PID_FILE", childPIDFile)
	evalsDir := evalsWithCase(t, "mkdir -p \"$1\"\n", map[string]string{"prompt.md": promptWithTimeout3, "graders/g.md": regexGrader})
	agg, res := runProbe(t, runner.Options{EvalsDir: evalsDir, OutDir: t.TempDir(), Threshold: 1})
	if res.Passed || len(res.Graders) != 0 || !strings.Contains(res.Error, "timed out") || strings.Contains(res.Error, "not counted") {
		t.Errorf("result = %+v, want a timeout error, no graders and a counted cost", res)
	}
	if res.CostUSD != 0.42 || res.NumTurns != 7 || res.Segments != 1 || agg.Aggregates.TotalCostUSD != 0.42 {
		t.Errorf("counters = %+v / %+v, want the interrupted run's cost and turns", res, agg.Aggregates)
	}
	if !childGone(t, childPIDFile) {
		t.Error("the tool child of the timed-out agent is still running")
	}
}

// secondSegmentClaude is a fake claude whose first segment ends with a result
// event and whose second segment is interrupted without one.
const secondSegmentClaude = `#!/bin/bash
trap 'exit 130' INT
echo '{"type":"result","subtype":"success","is_error":false,"result":"later","total_cost_usd":0.3,"duration_ms":500,"num_turns":2}'
echo '{"type":"assistant","message":{"content":[{"type":"text","text":"woke up"}]}}'
sleep 30 &
wait $!
`

func TestRunner_TimeoutInALaterSegmentSaysItsCostIsNotCounted(t *testing.T) {
	fakeClaude(t, secondSegmentClaude)
	evalsDir := evalsWithCase(t, "mkdir -p \"$1\"\n", map[string]string{"prompt.md": promptWithTimeout3, "graders/g.md": regexGrader})
	_, res := runProbe(t, runner.Options{EvalsDir: evalsDir, OutDir: t.TempDir(), Threshold: 1})
	if res.Passed || len(res.Graders) != 0 || !strings.Contains(res.Error, "the cost after its last result event is not counted") {
		t.Errorf("result = %+v, want a timeout error that says the last segment's cost is not counted", res)
	}
	if res.CostUSD != 0.3 || res.Segments != 1 {
		t.Errorf("counters = %+v, want the cost of the finished segment", res)
	}
}

// childGone reports whether the process whose pid the fake claude wrote has
// ended. It polls for up to five seconds, because a killed process stays
// visible until its new parent reaps it; a zombie counts as ended.
func childGone(t *testing.T, pidFile string) bool {
	t.Helper()
	raw, err := os.ReadFile(pidFile)
	if err != nil {
		t.Fatalf("read child pid: %v", err)
	}
	pid := strings.TrimSpace(string(raw))
	deadline := time.Now().Add(5 * time.Second)
	tick := time.NewTicker(50 * time.Millisecond)
	defer tick.Stop()
	for time.Now().Before(deadline) {
		state, _ := exec.Command("ps", "-o", "stat=", "-p", pid).Output() // exits 1 when the pid is gone
		if s := strings.TrimSpace(string(state)); s == "" || strings.HasPrefix(s, "Z") {
			return true
		}
		<-tick.C
	}
	return false
}

func TestRunner_CaseGlobAndTagSelect(t *testing.T) {
	fakeClaude(t, "#!/bin/bash\nexit 1\n")
	evalsDir := evalsWithCase(t, "mkdir -p \"$1\"\n", map[string]string{"prompt.md": "---\ntags: [cheap]\n---\nGo.\n", "graders/g.md": regexGrader})
	r, err := runner.New(runner.Options{EvalsDir: evalsDir, Tag: "cheap", CaseGlob: "pro*", Threshold: 0.5})
	if err != nil {
		t.Fatalf("New: %v", err)
	}
	if len(r.Cases()) != 1 || r.Cases()[0].Name != "probe" || r.Threshold().Value() != 0.5 {
		t.Errorf("selection = %+v", r.Cases())
	}
}

func TestNew_BrokenCaseDirBlocksOnlyWhenSelected(t *testing.T) {
	t.Parallel()
	evalsDir := evalsWithCase(t, "true\n", map[string]string{"prompt.md": "---\ntags: [cheap]\n---\nGo.\n", "graders/g.md": regexGrader})
	brokenDir := filepath.Join(evalsDir, "half-written")
	if err := os.MkdirAll(brokenDir, 0o755); err != nil {
		t.Fatalf("mkdir: %v", err)
	}
	if err := os.WriteFile(filepath.Join(brokenDir, "prompt.md"), []byte("no frontmatter\n"), 0o600); err != nil {
		t.Fatalf("write: %v", err)
	}
	selected := []runner.Options{
		{EvalsDir: evalsDir, CaseGlob: "probe"},
		{EvalsDir: evalsDir, Tag: "cheap"},
	}
	for _, opts := range selected {
		r, err := runner.New(opts)
		if err != nil {
			t.Fatalf("New(%+v): %v, want the good case selected past the broken dir", opts, err)
		}
		if len(r.Cases()) != 1 || r.Cases()[0].Name != "probe" {
			t.Errorf("New(%+v) selected %+v, want [probe]", opts, r.Cases())
		}
	}
}

func TestNew_BrokenCaseDirFailsWhenSelected(t *testing.T) {
	t.Parallel()
	evalsDir := evalsWithCase(t, "true\n", map[string]string{"prompt.md": promptWithModel, "graders/g.md": regexGrader})
	brokenDir := filepath.Join(evalsDir, "half-written")
	if err := os.MkdirAll(brokenDir, 0o755); err != nil {
		t.Fatalf("mkdir: %v", err)
	}
	if err := os.WriteFile(filepath.Join(brokenDir, "prompt.md"), []byte("no frontmatter\n"), 0o600); err != nil {
		t.Fatalf("write: %v", err)
	}
	failing := []runner.Options{
		{EvalsDir: evalsDir},
		{EvalsDir: evalsDir, CaseGlob: "half-*"},
	}
	for _, opts := range failing {
		if _, err := runner.New(opts); err == nil {
			t.Errorf("New(%+v): want an error for the selected broken dir, got nil", opts)
		}
	}
}

func TestNew_Error(t *testing.T) {
	t.Parallel()
	evalsDir := evalsWithCase(t, "true\n", map[string]string{"prompt.md": promptWithModel, "graders/g.md": regexGrader})
	cases := []struct {
		name    string
		opts    runner.Options
		wantErr error
	}{
		{name: "missing evals dir", opts: runner.Options{EvalsDir: filepath.Join(evalsDir, "nope")}},
		{name: "evals dir is a file", opts: runner.Options{EvalsDir: filepath.Join(evalsDir, "probe", "prompt.md")}},
		{name: "bad threshold", opts: runner.Options{EvalsDir: evalsDir, Threshold: 1.5}, wantErr: report.ErrBadThreshold},
		{name: "bad budget", opts: runner.Options{EvalsDir: evalsDir, MaxCostUSD: -1}, wantErr: report.ErrBadBudget},
		{name: "no case for tag", opts: runner.Options{EvalsDir: evalsDir, Tag: "expensive"}, wantErr: runner.ErrNoCases},
		{name: "malformed glob", opts: runner.Options{EvalsDir: evalsDir, CaseGlob: "["}},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			t.Parallel()
			_, err := runner.New(tc.opts)
			if err == nil {
				t.Fatal("New: want error, got nil")
			}
			if tc.wantErr != nil && !errors.Is(err, tc.wantErr) {
				t.Errorf("New error = %v, want %v", err, tc.wantErr)
			}
		})
	}
}

func TestRunner_AgentDoesNotInheritAutoBackground(t *testing.T) {
	t.Setenv("CLAUDE_AUTO_BACKGROUND_TASKS", "true")
	t.Setenv("ENABLE_CLAUDEAI_MCP_SERVERS", "true")
	fakeClaude(t, "#!/bin/bash\necho \"autobg=${CLAUDE_AUTO_BACKGROUND_TASKS-unset} sandbox=${IS_SANDBOX-unset} connectors=${ENABLE_CLAUDEAI_MCP_SERVERS-unset}\" >&2\n")
	// The case tries to turn the connectors back on; the runner's value must win.
	caseYAML := "schema_version: \"1.1\"\ncontext:\n  scaffold_script: ../scaffold/default.sh\ntier: cheap\nenv:\n  ENABLE_CLAUDEAI_MCP_SERVERS: \"true\"\n"
	evalsDir := evalsWithCase(t, "mkdir -p \"$1\"\n", map[string]string{"prompt.md": promptWithModel, "graders/g.md": regexGrader, "case.yaml": caseYAML})
	_, res := runProbe(t, runner.Options{EvalsDir: evalsDir, Threshold: 1})
	if !strings.Contains(res.Error, "autobg=unset sandbox=1 connectors=false") {
		t.Errorf("agent env (from stderr in Error) = %q, want the auto-background flag stripped, IS_SANDBOX set and the claude.ai connectors off", res.Error)
	}
}
