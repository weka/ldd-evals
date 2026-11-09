package transport_test

import (
	"context"
	"io"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"

	"example.com/go-mini/internal/transport"
)

const fallbackPath = "/fallback"

func TestCheckWebhook_ExpandsTheEndpointTemplate(t *testing.T) {
	env := map[string]string{"EMPTY": "", "HOOK": "alerts"}
	lookup := func(name string) (string, bool) {
		v, ok := env[name]
		return v, ok
	}

	tests := []struct {
		name     string
		template string
		wantPath string
	}{
		{name: "braced variable", template: "${HOOK}", wantPath: "/alerts"},
		{name: "bare variable", template: "$HOOK", wantPath: "/alerts"},
		{name: "default for unset", template: "${MISSING:-fallback}", wantPath: fallbackPath},
		{name: "colon default for empty", template: "${EMPTY:-fallback}", wantPath: fallbackPath},
		{name: "plain default keeps empty", template: "x${EMPTY-fallback}", wantPath: "/x"},
		{name: "plain default for unset", template: "${MISSING-fallback}", wantPath: fallbackPath},
		{name: "escaped dollar", template: "$$HOOK", wantPath: "/$HOOK"},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			gotPath := make(chan string, 1)
			srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				_, _ = io.Copy(io.Discard, r.Body)
				gotPath <- r.URL.Path
				w.WriteHeader(http.StatusNoContent)
			}))
			defer srv.Close()

			cfg := transport.WebhookConfig{Path: writeConfig(t, srv.URL+"/"+tc.template+"/"), Env: lookup}
			res, err := transport.CheckWebhook(context.Background(), cfg)
			if err != nil {
				t.Fatalf("CheckWebhook() error = %v", err)
			}
			if res.Status != http.StatusNoContent {
				t.Errorf("Status = %d, want %d", res.Status, http.StatusNoContent)
			}
			if got := <-gotPath; got != tc.wantPath {
				t.Errorf("request path = %q, want %q", got, tc.wantPath)
			}
		})
	}
}

func TestCheckWebhook_ReportsAFailureStatus(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusBadGateway)
	}))
	defer srv.Close()

	res, err := transport.CheckWebhook(context.Background(), transport.WebhookConfig{Path: writeConfig(t, srv.URL)})
	if err == nil {
		t.Fatal("CheckWebhook() error = nil, want a status error")
	}
	if res.Status != http.StatusBadGateway {
		t.Errorf("Status = %d, want %d", res.Status, http.StatusBadGateway)
	}
}

func writeConfig(t *testing.T, text string) string {
	t.Helper()
	path := filepath.Join(t.TempDir(), "webhook.conf")
	if err := os.WriteFile(path, []byte(text), 0o600); err != nil {
		t.Fatal(err)
	}
	return path
}
