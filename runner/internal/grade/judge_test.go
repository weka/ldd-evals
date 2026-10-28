package grade_test

import (
	"context"
	"math"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"testing"

	"github.com/buzzdan/ldd-evals/runner/internal/grade"
)

// fakeJudgeSequence makes the fake claude answer the given verdicts one call at
// a time and returns a function reading how many calls it has answered.
func fakeJudgeSequence(t *testing.T, verdicts string) func() int {
	t.Helper()
	useFakeClaude(t)
	countFile := filepath.Join(t.TempDir(), "count")
	t.Setenv("FAKE_JUDGE_VERDICTS", verdicts)
	t.Setenv("FAKE_JUDGE_COUNT_FILE", countFile)
	return func() int {
		data, err := os.ReadFile(countFile)
		if err != nil {
			return 0
		}
		n, err := strconv.Atoi(strings.TrimSpace(string(data)))
		if err != nil {
			t.Fatalf("count file %q: %v", data, err)
		}
		return n
	}
}

func TestJudge_Vote_UnanimousStopsAtTwo(t *testing.T) {
	calls := fakeJudgeSequence(t, "PASS,PASS,FAIL")
	judge, err := grade.NewJudge("fake-judge")
	if err != nil {
		t.Fatalf("NewJudge: %v", err)
	}
	v, err := judge.Vote(context.Background(), "prompt")
	if err != nil {
		t.Fatalf("Vote: %v", err)
	}
	if !v.Passed || v.Tally() != "PASS,PASS" || calls() != 2 {
		t.Errorf("Vote = passed %v tally %q after %d calls, want PASS,PASS after 2", v.Passed, v.Tally(), calls())
	}
	if math.Abs(v.CostUSD-0.002) > 1e-9 {
		t.Errorf("CostUSD = %v, want the two votes summed (0.002)", v.CostUSD)
	}
	if !strings.Contains(v.Reply, "--- vote 1: PASS ---") || !strings.Contains(v.Reply, "--- vote 2: PASS ---") {
		t.Errorf("Reply should carry every vote in order, got %q", v.Reply)
	}
}

func TestJudge_Vote_SplitTakesThree(t *testing.T) {
	calls := fakeJudgeSequence(t, "PASS,FAIL,FAIL")
	judge, err := grade.NewJudge("fake-judge")
	if err != nil {
		t.Fatalf("NewJudge: %v", err)
	}
	v, err := judge.Vote(context.Background(), "prompt")
	if err != nil {
		t.Fatalf("Vote: %v", err)
	}
	if v.Passed || v.Tally() != "PASS,FAIL,FAIL" || calls() != 3 {
		t.Errorf("Vote = passed %v tally %q after %d calls, want FAIL by 2-of-3 after 3", v.Passed, v.Tally(), calls())
	}
	if math.Abs(v.CostUSD-0.003) > 1e-9 {
		t.Errorf("CostUSD = %v, want the three votes summed (0.003)", v.CostUSD)
	}
}

func TestLLM_Grade_DetailCarriesTheTally(t *testing.T) {
	fakeJudgeSequence(t, "FAIL,PASS,PASS")
	judge, err := grade.NewJudge("fake-judge")
	if err != nil {
		t.Fatalf("NewJudge: %v", err)
	}
	g, err := grade.NewLLM("art", "c", "", grade.FocusLastMessage())
	if err != nil {
		t.Fatalf("NewLLM: %v", err)
	}
	outDir := t.TempDir()
	out := g.Grade(context.Background(), grade.Subject{Trace: parseTrace(t, resultEvent("x")), OutDir: outDir, Judge: judge})
	if !out.Passed || !strings.Contains(out.Detail, "judge fake-judge (FAIL,PASS,PASS):") {
		t.Errorf("Outcome = %+v, want PASS with the tally in Detail", out)
	}
	if math.Abs(out.CostUSD-0.003) > 1e-9 {
		t.Errorf("CostUSD = %v, want 0.003", out.CostUSD)
	}
	reply, err := os.ReadFile(filepath.Join(outDir, "judge-art.txt"))
	if err != nil || strings.Count(string(reply), "--- vote ") != 3 {
		t.Errorf("judge reply artifact should hold all three votes, got %q, %v", reply, err)
	}
}

func TestVerdict_Tally(t *testing.T) {
	t.Parallel()
	if got := (grade.Verdict{}).Tally(); got != "" {
		t.Errorf("empty Tally() = %q, want empty", got)
	}
	if got := (grade.Verdict{Votes: []bool{true, false}}).Tally(); got != "PASS,FAIL" {
		t.Errorf("Tally() = %q, want PASS,FAIL", got)
	}
}
