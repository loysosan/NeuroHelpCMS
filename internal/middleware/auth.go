package middleware

import (
	"context"
	"net/http"
	"strings"
	"user-api/internal/handlers"

	"github.com/golang-jwt/jwt/v4"
	"github.com/rs/zerolog/log"
)

func RequireAdmin(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		tokenHeader := r.Header.Get("Authorization")
		if tokenHeader == "" || !strings.HasPrefix(tokenHeader, "Bearer ") {
			log.Warn().Msg("RequireAdmin: Authorization header missing or improperly formatted")
			http.Error(w, "No token", http.StatusUnauthorized)
			return
		}

		tokenStr := strings.TrimPrefix(tokenHeader, "Bearer ")
		claims := &handlers.Claims{}
		token, err := jwt.ParseWithClaims(tokenStr, claims, func(t *jwt.Token) (interface{}, error) {
			return []byte("super-secret"), nil
		})

		if err != nil || !token.Valid || claims.Role != "admin" {
			log.Warn().Str("error", err.Error()).Str("role", claims.Role).Msg("RequireAdmin: Invalid token or insufficient privileges")
			http.Error(w, "Forbidden", http.StatusForbidden)
			return
		}

		log.Info().Str("username", claims.Username).Msg("RequireAdmin: Authorized admin access")

		r = r.WithContext(context.WithValue(r.Context(), "username", claims.Username))
		next.ServeHTTP(w, r)
	})
}
