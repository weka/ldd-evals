// Package tagfilter selects devices by their tags.
package tagfilter

import (
	"fmt"
	"slices"
	"strings"
)

// Match reports whether tags satisfy expr. expr is a comma-separated list of
// terms, and every term must hold: "key:value" needs a tag with that key and
// value, "key" needs a tag with that key and any value, and a leading "!"
// needs no such tag. A key may appear in one term only. An empty expr matches
// every tag list.
func Match(tags []string, expr string) (bool, error) {
	if strings.TrimSpace(expr) == "" {
		return true, nil
	}
	f, err := parseFilter(expr)
	if err != nil {
		return false, err
	}
	return f.matches(readTags(tags)), nil
}

// filter holds the parsed terms. A value of "" matches any value.
type filter struct {
	want map[string]string
	deny map[string]string
}

func parseFilter(expr string) (filter, error) {
	f := filter{want: map[string]string{}, deny: map[string]string{}}
	for _, raw := range strings.Split(expr, ",") {
		term := strings.TrimSpace(raw)
		into := f.want
		if rest, negated := strings.CutPrefix(term, "!"); negated {
			term, into = rest, f.deny
		}
		key, value, _ := strings.Cut(term, ":")
		key, value = strings.ToLower(strings.TrimSpace(key)), strings.TrimSpace(value)
		if key == "" || strings.Contains(value, ":") {
			return filter{}, fmt.Errorf("tag filter: bad term %q", raw)
		}
		if _, dup := f.want[key]; dup {
			return filter{}, fmt.Errorf("tag filter: key %q twice", key)
		}
		if _, dup := f.deny[key]; dup {
			return filter{}, fmt.Errorf("tag filter: key %q twice", key)
		}
		into[key] = value
	}
	return f, nil
}

// matches takes the device tags as key → values.
func (f filter) matches(tags map[string][]string) bool {
	for key, value := range f.want {
		if !hasValue(tags[key], value) {
			return false
		}
	}
	for key, value := range f.deny {
		if hasValue(tags[key], value) {
			return false
		}
	}
	return true
}

func hasValue(values []string, value string) bool {
	if value == "" {
		return len(values) > 0
	}
	return slices.Contains(values, value)
}
