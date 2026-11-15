package tagfilter_test

import (
	"testing"

	"example.com/go-mini/internal/tagfilter"
)

func TestMatch(t *testing.T) {
	tags := []string{"region:eu", "Tier=gold", "retired"}
	tests := []struct {
		expr string
		want bool
	}{
		{"region:eu", true},
		{"region:us", false},
		{"region", true},
		{"tier:gold", true},
		{"!retired", false},
		{"!zone", true},
		{"region:eu, !retired", false},
		{"region:eu,tier:silver", false},
		{" region : eu ", true},
	}
	for _, tt := range tests {
		t.Run(tt.expr, func(t *testing.T) {
			got, err := tagfilter.Match(tags, tt.expr)
			if err != nil {
				t.Fatalf("Match(%q) error = %v", tt.expr, err)
			}
			if got != tt.want {
				t.Errorf("Match(%q) = %v, want %v", tt.expr, got, tt.want)
			}
		})
	}
}

func TestMatch_RefusesABadFilter(t *testing.T) {
	for _, expr := range []string{"", "region:eu,", "!", ":eu", "region:eu:x", "region:eu,region:us", "region,!region"} {
		if _, err := tagfilter.Match(nil, expr); err == nil {
			t.Errorf("Match(%q) error = nil, want an error", expr)
		}
	}
}
