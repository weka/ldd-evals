package handlers

import (
	"net/http"

	"example.com/go-mini/internal/models"
)

// requireWrite runs next only when grants carry write permission; a service
// started read-only keeps serving reads while every mutation is refused.
func requireWrite(grants models.Grants, next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if !grants.Has(models.PermWrite) {
			http.Error(w, "write permission required", http.StatusForbidden)
			return
		}
		next(w, r)
	}
}
