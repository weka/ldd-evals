package transport

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"regexp"
	"strings"
)

// Result holds the status code of the POST. CheckWebhook also returns it with
// the error for a non-2xx status.
type Result struct {
	Status int
}

// CheckWebhook reads the endpoint template from the config file, expands the
// environment references in it with env and POSTs to the result. A non-2xx
// answer is an error.
func CheckWebhook(ctx context.Context, path string, env func(string) (string, bool)) (Result, error) {
	raw, err := os.ReadFile(path)
	if err != nil {
		return Result{}, fmt.Errorf("transport: read webhook config: %w", err)
	}
	expanded := expandEnv(strings.TrimSpace(string(raw)), env)
	endpoint := trimSlash(expanded)

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, http.NoBody)
	if err != nil {
		return Result{}, fmt.Errorf("transport: build webhook request: %w", err)
	}
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return Result{}, fmt.Errorf("transport: post %s: %w", endpoint, err)
	}
	defer func() { _ = resp.Body.Close() }()
	if resp.StatusCode < 200 || resp.StatusCode > 299 {
		return Result{Status: resp.StatusCode}, fmt.Errorf("transport: post %s: status %d", endpoint, resp.StatusCode)
	}
	return Result{Status: resp.StatusCode}, nil
}

// expandEnv replaces $$, $VAR, ${VAR}, ${VAR:-default} and ${VAR-default}.
// The ":-" form also applies the default when the variable is empty.
func expandEnv(text string, env func(string) (string, bool)) string {
	ref := regexp.MustCompile(`\$(?:(\$)|\{(\w+)(?:(:?-)([^}]*))?\}|(\w+))`)
	return ref.ReplaceAllStringFunc(text, func(match string) string {
		parts := ref.FindStringSubmatch(match)
		if parts[1] != "" {
			return "$"
		}
		name := parts[2] + parts[5]
		value, set := env(name)
		if parts[3] == ":-" && value == "" {
			set = false
		}
		if !set && parts[3] != "" {
			return parts[4]
		}
		return value
	})
}

func trimSlash(s string) string {
	return strings.TrimRight(s, "/")
}
