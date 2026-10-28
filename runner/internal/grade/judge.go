package grade

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"os/exec"
	"regexp"
	"strings"
)

// ErrNoVerdict is returned when the judge's reply has no final VERDICT line.
var ErrNoVerdict = errors.New("grade: judge reply has no `VERDICT: PASS|FAIL` line")

// ErrEmptyModel is returned when a Judge is built without a model.
var ErrEmptyModel = errors.New("grade: judge model is required")

// Verdict is a judge's answer: one reply from Ask, or the majority of the
// replies Vote collected, with Votes recording each reply's verdict in order.
type Verdict struct {
	Passed  bool
	Reply   string
	CostUSD float64
	Votes   []bool
}

// Tally renders the votes as "PASS,FAIL,PASS"; empty for a single reply.
func (v Verdict) Tally() string {
	parts := make([]string, 0, len(v.Votes))
	for _, passed := range v.Votes {
		parts = append(parts, passFail(passed))
	}
	return strings.Join(parts, ",")
}

func passFail(passed bool) string {
	if passed {
		return "PASS"
	}
	return "FAIL"
}

// maxVotes is the most replies a Vote collects; two agreeing replies decide,
// so a unanimous verdict costs two calls and a split one three, as in
// plugin-eval's 2-of-3 judge.
const maxVotes = 3

// Judge runs `claude -p --model <judge> --output-format json --tools ""` with
// the prompt on stdin.
type Judge struct {
	model string
}

// Vote asks until two replies agree (at most three) and returns the majority
// verdict; the reply carries every vote in order and the cost is their sum.
func (j Judge) Vote(ctx context.Context, prompt string) (Verdict, error) {
	var out Verdict
	var replies []string
	pass, fail := 0, 0
	for i := 1; i <= maxVotes && pass < 2 && fail < 2; i++ {
		v, err := j.Ask(ctx, prompt)
		if err != nil {
			return Verdict{}, fmt.Errorf("vote %d: %w", i, err)
		}
		if v.Passed {
			pass++
		} else {
			fail++
		}
		out.Votes = append(out.Votes, v.Passed)
		out.CostUSD += v.CostUSD
		replies = append(replies, fmt.Sprintf("--- vote %d: %s ---\n%s", i, passFail(v.Passed), v.Reply))
	}
	out.Passed = pass > fail
	out.Reply = strings.Join(replies, "\n\n")
	return out, nil
}

// NewJudge validates and builds a Judge.
func NewJudge(model string) (Judge, error) {
	model = strings.TrimSpace(model)
	if model == "" {
		return Judge{}, ErrEmptyModel
	}
	return Judge{model: model}, nil
}

// Model returns the judge model id.
func (j Judge) Model() string { return j.model }

type judgeResult struct {
	Result       string  `json:"result"`
	TotalCostUSD float64 `json:"total_cost_usd"`
	IsError      bool    `json:"is_error"`
	Subtype      string  `json:"subtype"`
}

// Ask sends the prompt to the judge model and parses the final VERDICT line.
func (j Judge) Ask(ctx context.Context, prompt string) (Verdict, error) {
	if j.model == "" {
		return Verdict{}, ErrEmptyModel
	}
	cmd := exec.CommandContext(ctx, "claude",
		"-p", "--model", j.model, "--output-format", "json",
		"--max-turns", "1", "--tools", "", "--no-session-persistence")
	cmd.Stdin = strings.NewReader(prompt)
	var stderr bytes.Buffer
	cmd.Stderr = &stderr
	out, err := cmd.Output()
	if err != nil {
		return Verdict{}, fmt.Errorf("judge claude -p: %w: %s", err, clip(stderr.String()))
	}
	var res judgeResult
	if err := json.Unmarshal(bytes.TrimSpace(out), &res); err != nil {
		return Verdict{}, fmt.Errorf("judge output is not a result object: %w: %s", err, clip(string(out)))
	}
	if res.IsError {
		return Verdict{}, fmt.Errorf("judge run failed (%s): %s", res.Subtype, clip(res.Result))
	}
	passed, err := ParseVerdict(res.Result)
	if err != nil {
		return Verdict{}, err
	}
	return Verdict{Passed: passed, Reply: res.Result, CostUSD: res.TotalCostUSD}, nil
}

// ParseVerdict finds the last `VERDICT: PASS|FAIL` line of a reply
// (case-insensitive, tolerant of surrounding markdown emphasis).
func ParseVerdict(reply string) (bool, error) {
	re := regexp.MustCompile(`(?i)^\W*VERDICT\W*(PASS|FAIL)\W*$`)
	lines := strings.Split(reply, "\n")
	for i := len(lines) - 1; i >= 0; i-- {
		m := re.FindStringSubmatch(strings.TrimSpace(lines[i]))
		if m != nil {
			return strings.EqualFold(m[1], "PASS"), nil
		}
	}
	return false, ErrNoVerdict
}
