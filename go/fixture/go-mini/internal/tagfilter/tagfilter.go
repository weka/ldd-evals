// Package tagfilter selects devices by their tags.
package tagfilter

import (
	"fmt"
	"strings"
)

// Match reports whether tags satisfy expr. expr is a comma-separated list of
// terms, and every term must hold: "key:value" needs a tag with that key and
// value, "key" needs a tag with that key and any value, and a leading "!"
// needs no such tag. A key may appear in one term only.
func Match(tags []string, expr string) (bool, error) {
	f, err := parseFilter(expr)
	if err != nil {
		return false, err
	}
	return f.matches(tags), nil
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
		key, value, ok := splitTag(term)
		if !ok {
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

func (f filter) matches(tags []string) bool {
	for key, value := range f.want {
		if !f.has(tags, key, value) {
			return false
		}
	}
	for key, value := range f.deny {
		if f.has(tags, key, value) {
			return false
		}
	}
	return true
}

func (f filter) has(tags []string, key, value string) bool {
	for _, tag := range tags {
		k, v, ok := splitTag(tag)
		if ok && k == key && (value == "" || v == value) {
			return true
		}
	}
	return false
}
