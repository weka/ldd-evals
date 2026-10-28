package grade

import (
	"context"
	"errors"
	"fmt"
	"os"
	"path"
	"path/filepath"
	"strings"
)

// ErrEmptyCriteria is returned when an llm grader has no criteria.
var ErrEmptyCriteria = errors.New("grade: llm criteria is required")

// ErrBadFocus is returned for an unsupported focus specification.
var ErrBadFocus = errors.New("grade: focus must be last_message, {source: file, path: ...} or {source: files, paths: [...]}")

type focusKind int

const (
	focusLastMessage focusKind = iota
	focusFile
	focusFiles
)

// ErrBadSourceGlob is returned for a source or test glob path.Match rejects.
var ErrBadSourceGlob = errors.New("grade: src_glob and test_glob must be valid path.Match patterns over a file name")

// SourceFilter names, as path.Match globs over a file's base name, which
// files of a directory are source files and which of those are tests. A
// directory focus renders the source files that are not tests. The zero
// value is not usable; DefaultSourceFilter is the Go suite's.
type SourceFilter struct {
	src  string
	test string
}

// DefaultSourceFilter is the filter every case used before suites could name
// their own: Go source files, tests by the _test.go suffix.
func DefaultSourceFilter() SourceFilter { return SourceFilter{src: "*.go", test: "*_test.go"} }

// NewSourceFilter validates two globs; an empty glob keeps the default's.
func NewSourceFilter(src, test string) (SourceFilter, error) {
	f := DefaultSourceFilter()
	if s := strings.TrimSpace(src); s != "" {
		f.src = s
	}
	if t := strings.TrimSpace(test); t != "" {
		f.test = t
	}
	for _, g := range []string{f.src, f.test} {
		if _, err := path.Match(g, "x"); err != nil {
			return SourceFilter{}, fmt.Errorf("%w: %q: %w", ErrBadSourceGlob, g, err)
		}
	}
	return f, nil
}

// IsSource reports whether a file name is a non-test source file.
func (f SourceFilter) IsSource(name string) bool {
	src, _ := path.Match(f.src, name)
	test, _ := path.Match(f.test, name)
	return src && !test
}

// Src is the source glob.
func (f SourceFilter) Src() string { return f.src }

// Test is the test glob.
func (f SourceFilter) Test() string { return f.test }

// String renders the filter for detail messages.
func (f SourceFilter) String() string { return f.src + " minus " + f.test }

// Focus names the text the judge reads: the final assistant message, one
// file from the scaffold dir, or several files rendered one after another
// under their paths. A directory among the paths stands for the files the
// focus's SourceFilter keeps.
type Focus struct {
	kind   focusKind
	paths  []string
	filter SourceFilter
}

// FocusLastMessage is the default focus.
func FocusLastMessage() Focus { return Focus{kind: focusLastMessage} }

// FocusFile focuses the judge on a file relative to the scaffold dir.
func FocusFile(path string) (Focus, error) {
	path, err := relativePath(path)
	if err != nil {
		return Focus{}, err
	}
	return Focus{kind: focusFile, paths: []string{path}}, nil
}

// FocusFiles focuses the judge on several paths relative to the scaffold dir,
// rendered in order, each file under a "### <path>" heading, so one judge can
// check that concepts landed in the right file. A path may be a directory,
// which stands for its non-test source files under the default (Go) filter;
// WithSources swaps the filter.
func FocusFiles(paths []string) (Focus, error) {
	if len(paths) == 0 {
		return Focus{}, fmt.Errorf("%w: files focus needs at least one path", ErrBadFocus)
	}
	clean := make([]string, 0, len(paths))
	for _, p := range paths {
		rel, err := relativePath(p)
		if err != nil {
			return Focus{}, err
		}
		clean = append(clean, rel)
	}
	return Focus{kind: focusFiles, paths: clean, filter: DefaultSourceFilter()}, nil
}

// WithSources returns the focus with the filter a directory path expands
// through. Only a files focus reads it.
func (f Focus) WithSources(filter SourceFilter) Focus {
	f.filter = filter
	return f
}

func relativePath(path string) (string, error) {
	path = strings.TrimSpace(path)
	if path == "" || filepath.IsAbs(path) {
		return "", fmt.Errorf("%w: file path must be non-empty and relative, got %q", ErrBadFocus, path)
	}
	return path, nil
}

// String renders the focus for prompts and detail messages.
func (f Focus) String() string {
	switch f.kind {
	case focusFile:
		return "file " + f.paths[0]
	case focusFiles:
		return "files " + strings.Join(f.paths, ", ")
	default:
		return "last_message"
	}
}

// text resolves the focus against the subject. Every named file must exist;
// a missing one fails the grader before the judge is consulted.
func (f Focus) text(s Subject) (string, error) {
	switch f.kind {
	case focusFile:
		data, err := os.ReadFile(filepath.Join(s.Dir, f.paths[0]))
		if err != nil {
			return "", fmt.Errorf("read focus file: %w", err)
		}
		return string(data), nil
	case focusFiles:
		var b strings.Builder
		for _, p := range f.paths {
			files, err := expandFocusPath(s.Dir, p, f.filter)
			if err != nil {
				return "", err
			}
			for _, rel := range files {
				data, err := os.ReadFile(filepath.Join(s.Dir, rel))
				if err != nil {
					return "", fmt.Errorf("read focus file: %w", err)
				}
				b.WriteString("### " + rel + "\n\n")
				b.Write(data)
				b.WriteString("\n\n")
			}
		}
		return b.String(), nil
	default:
		return s.Trace.LastMessage(), nil
	}
}

// expandFocusPath returns the files a focus path names: the file itself, or,
// for a directory, the non-test source files the filter keeps, in name order.
// A refactor is free to move a concept into a new file of the package it
// belongs to; a directory focus keeps the judge looking at the package, not
// at a filename the agent may rightly have deleted.
func expandFocusPath(root, rel string, filter SourceFilter) ([]string, error) {
	info, err := os.Stat(filepath.Join(root, rel))
	if err != nil {
		return nil, fmt.Errorf("read focus file: %w", err)
	}
	if !info.IsDir() {
		return []string{rel}, nil
	}
	entries, err := os.ReadDir(filepath.Join(root, rel))
	if err != nil {
		return nil, fmt.Errorf("read focus dir: %w", err)
	}
	var files []string
	for _, e := range entries {
		if e.IsDir() || !filter.IsSource(e.Name()) {
			continue
		}
		files = append(files, filepath.Join(rel, e.Name()))
	}
	if len(files) == 0 {
		return nil, fmt.Errorf("read focus dir: %s holds no non-test source files (%s)", rel, filter)
	}
	return files, nil
}

// LLM asks a judge model for a PASS/FAIL verdict on the focus text.
type LLM struct {
	name     string
	criteria string
	rubric   string
	focus    Focus
}

// NewLLM validates and builds an LLM grader; rubric (the file body) may be
// empty.
func NewLLM(name, criteria, rubric string, focus Focus) (LLM, error) {
	if strings.TrimSpace(name) == "" {
		return LLM{}, ErrEmptyName
	}
	if strings.TrimSpace(criteria) == "" {
		return LLM{}, fmt.Errorf("grader %s: %w", name, ErrEmptyCriteria)
	}
	return LLM{name: name, criteria: strings.TrimSpace(criteria), rubric: strings.TrimSpace(rubric), focus: focus}, nil
}

// Name implements Grader.
func (g LLM) Name() string { return g.name }

// Type implements Grader.
func (g LLM) Type() string { return "llm" }

// Prompt renders the judge prompt for the given focus text.
func (g LLM) Prompt(focusText string) string {
	var b strings.Builder
	b.WriteString("You are grading the output of an automated coding agent for an evaluation suite.\n")
	b.WriteString("Decide whether the FOCUS text satisfies the CRITERIA, using the RUBRIC where given.\n")
	b.WriteString("Do not use tools. Reply with brief reasoning, then a final line that is exactly\n")
	b.WriteString("`VERDICT: PASS` or `VERDICT: FAIL`.\n\n")
	b.WriteString("## CRITERIA\n\n" + g.criteria + "\n\n")
	if g.rubric != "" {
		b.WriteString("## RUBRIC\n\n" + g.rubric + "\n\n")
	}
	b.WriteString("## FOCUS (" + g.focus.String() + ")\n\n")
	b.WriteString(focusText)
	b.WriteString("\n")
	return b.String()
}

// Grade implements Grader. The judge votes (two agreeing replies decide, at
// most three); a missing focus file fails without spending on it.
func (g LLM) Grade(ctx context.Context, s Subject) Outcome {
	focusText, err := g.focus.text(s)
	if err != nil {
		return failf(g.name, g.Type(), "%v", err)
	}
	v, err := s.Judge.Vote(ctx, g.Prompt(focusText))
	if err != nil {
		return failf(g.name, g.Type(), "judge: %v", err)
	}
	g.saveReply(s.OutDir, v.Reply)
	out := verdict(g.name, g.Type(), v.Passed, clip(fmt.Sprintf("judge %s (%s): %s", s.Judge.Model(), v.Tally(), v.Reply)))
	out.CostUSD = v.CostUSD
	return out
}

func (g LLM) saveReply(outDir, reply string) {
	if outDir == "" {
		return
	}
	_ = os.WriteFile(filepath.Join(outDir, "judge-"+g.name+".txt"), []byte(reply), 0o644) // best-effort artifact; the verdict is already in Outcome
}
