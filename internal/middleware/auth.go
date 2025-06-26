package middleware

import (
	"context"
	"net/http"
	"strings"
	"user-api/internal/handlers"
	"user-api/internal/models"
	"user-api/internal/db"
	"user-api/internal/utils"

	"github.com/golang-jwt/jwt/v4"
	"github.com/rs/zerolog/log"
	"github.com/go-ini/ini"
	"encoding/json"
)

var cfg *ini.File

func init() {
	var err error
	cfg, err = ini.Load("config.ini")
	if err != nil {
		log.Fatal().Err(err).Msg("Failed to load config.ini")
	}
}

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
			return []byte(cfg.Section("auth").Key("jwt_admin_secret").String()), nil
		})

		if err != nil || !token.Valid || claims.Role != "admin" {
			log.Warn().Str("error", err.Error()).Str("role", claims.Role).Msg("RequireAdmin: Invalid token or insufficient privileges")
			http.Error(w, "Forbidden", http.StatusForbidden)
			return
		}

		log.Info().Str("username", claims.Username).Msg("RequireAdmin: Authorized admin access")

		// Після перевірки токена:
		var admin models.Administrator
		if err := db.DB.Where("role = ?", claims.Username).First(&admin).Error; err != nil {
			log.Warn().Err(err).Msg("RequireAdmin: Failed to load admin from DB")
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}
		ctx := context.WithValue(r.Context(), "admin", &admin)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// RequireUser checks for a valid JWT token and ensures the user is active.
func RequireUser(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		tokenHeader := r.Header.Get("Authorization")
		if tokenHeader == "" || !strings.HasPrefix(tokenHeader, "Bearer ") {
			log.Warn().Msg("RequireUser: Authorization header missing or improperly formatted")
			http.Error(w, "No token", http.StatusUnauthorized)
			return
		}

		tokenStr := strings.TrimPrefix(tokenHeader, "Bearer ")
		claims := &handlers.Claims{}
		token, err := jwt.ParseWithClaims(tokenStr, claims, func(t *jwt.Token) (interface{}, error) {
			return []byte(cfg.Section("auth").Key("jwt_user_secret").String()), nil
		})

		if err != nil || !token.Valid {
			log.Warn().Err(err).Msg("RequireUser: Invalid token")
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		// Load user from DB
		var user models.User
		if err := db.DB.Where("email = ?", claims.Username).First(&user).Error; err != nil {
			log.Warn().Err(err).Msg("RequireUser: Failed to load user from DB")
			http.Error(w, "Forbidden", http.StatusForbidden)
			return
		}
		if user.Status != "Active" {
			log.Warn().Str("status", user.Status).Msg("RequireUser: user is not active")
			http.Error(w, "Forbidden", http.StatusForbidden)
			return
		}

		log.Info().Str("email", claims.Username).Msg("RequireUser: Authorized user access")

		r = r.WithContext(context.WithValue(r.Context(), "email", claims.Username))
		next.ServeHTTP(w, r)
	})
}

// Псевдокод для login handler
func LoginHandler(w http.ResponseWriter, r *http.Request) {
	var user models.User
	if err := json.NewDecoder(r.Body).Decode(&user); err != nil {
		log.Warn().Err(err).Msg("LoginHandler: Invalid request payload")
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	// Validate user credentials (this is just pseudocode, implement your own logic)
	if user.Email == "" || user.Password == "" {
		http.Error(w, "Email and password are required", http.StatusBadRequest)
		return
	}

	// Check if user exists and password matches
	var dbUser models.User
	if err := db.DB.Where("email = ?", user.Email).First(&dbUser).Error; err != nil {
		log.Warn().Err(err).Msg("LoginHandler: User not found")
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	accessToken, _ := utils.GenerateAccessToken(&dbUser)
	refreshToken, _ := utils.GenerateRefreshToken(&dbUser)

	// Update refresh token in DB
	dbUser.RefreshToken = refreshToken
	if err := db.DB.Save(&dbUser).Error; err != nil {
		log.Error().Err(err).Msg("LoginHandler: Failed to save refresh token")
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	// Set refresh token cookie
	http.SetCookie(w, &http.Cookie{
		Name:     "refresh_token",
		Value:    refreshToken,
		HttpOnly: true,
		Path:     "/api/auth/refresh",
		MaxAge:   7 * 24 * 3600,
	})

	// Respond with access token
	json.NewEncoder(w).Encode(map[string]interface{}{
		"access_token": accessToken,
	})
}