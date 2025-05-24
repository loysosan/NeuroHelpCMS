package middleware

import (
	"context"
	"net/http"
	"strings"
	"user-api/internal/handlers"

	"github.com/golang-jwt/jwt/v4"
)

func RequireAdmin(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		tokenHeader := r.Header.Get("Authorization")
		if tokenHeader == "" || !strings.HasPrefix(tokenHeader, "Bearer ") {
			http.Error(w, "No token", http.StatusUnauthorized)
			return
		}

		tokenStr := strings.TrimPrefix(tokenHeader, "Bearer ")
		claims := &handlers.Claims{}
		token, err := jwt.ParseWithClaims(tokenStr, claims, func(t *jwt.Token) (interface{}, error) {
			return []byte("super-secret"), nil
		})

		if err != nil || !token.Valid || claims.Role != "admin" {
			http.Error(w, "Forbidden", http.StatusForbidden)
			return
		}

		r = r.WithContext(context.WithValue(r.Context(), "username", claims.Username))
		next.ServeHTTP(w, r)
	})
}
