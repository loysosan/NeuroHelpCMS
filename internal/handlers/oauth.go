package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"user-api/internal/db"
	"user-api/internal/models"
	"user-api/internal/utils"

	"github.com/rs/zerolog/log"
	"google.golang.org/api/idtoken"
)

type GoogleAuthRequest struct {
	IDToken string `json:"idToken"`
}

// GoogleAuth godoc
// @Summary      Authenticate with Google
// @Description  Authenticate or check registration status using Google ID token
// @Tags         Auth
// @Accept       json
// @Produce      json
// @Param        body body GoogleAuthRequest true "Google ID token"
// @Success      200 {object} map[string]interface{}
// @Failure      400,401,500 {object} map[string]interface{}
// @Router       /api/auth/google [post]
func GoogleAuth(w http.ResponseWriter, r *http.Request) {
	var req GoogleAuthRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "INVALID_JSON", "Invalid request format")
		return
	}

	if req.IDToken == "" {
		utils.WriteError(w, http.StatusBadRequest, "MISSING_TOKEN", "Google ID token is required")
		return
	}

	// Validate Google ID token
	googleClientID := cfg.Section("google").Key("client_id").String()
	payload, err := idtoken.Validate(context.Background(), req.IDToken, googleClientID)
	if err != nil {
		log.Warn().Err(err).Msg("GoogleAuth: failed to validate Google ID token")
		utils.WriteError(w, http.StatusUnauthorized, "INVALID_GOOGLE_TOKEN", "Invalid Google token")
		return
	}

	// Extract user info from Google token payload
	googleID, _ := payload.Claims["sub"].(string)
	email, _ := payload.Claims["email"].(string)
	firstName, _ := payload.Claims["given_name"].(string)
	lastName, _ := payload.Claims["family_name"].(string)

	if googleID == "" || email == "" {
		log.Warn().Msg("GoogleAuth: missing required fields in Google token")
		utils.WriteError(w, http.StatusBadRequest, "INCOMPLETE_GOOGLE_DATA", "Google token missing required fields")
		return
	}

	// Try to find user by GoogleID
	var user models.User
	if err := db.DB.Where("google_id = ?", googleID).First(&user).Error; err == nil {
		// User found by GoogleID — authenticate
		loginAndRespond(w, &user)
		return
	}

	// Try to find user by email (link existing account)
	if err := db.DB.Where("email = ?", email).First(&user).Error; err == nil {
		// User with this email exists but without GoogleID — link account
		user.GoogleID = googleID
		if err := db.DB.Save(&user).Error; err != nil {
			log.Error().Err(err).Msg("GoogleAuth: failed to link Google account")
			utils.WriteError(w, http.StatusInternalServerError, "DB_ERROR", "Failed to link Google account")
			return
		}
		log.Info().Str("email", email).Msg("GoogleAuth: linked Google account to existing user")
		loginAndRespond(w, &user)
		return
	}

	// User not found — registration required
	log.Info().Str("email", email).Msg("GoogleAuth: new user, registration required")
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status": "registration_required",
		"googleUser": map[string]string{
			"email":     email,
			"firstName": firstName,
			"lastName":  lastName,
			"googleId":  googleID,
		},
	})
}

// loginAndRespond generates JWT tokens and sends authentication response
func loginAndRespond(w http.ResponseWriter, user *models.User) {
	if user.Status == "Blocked" {
		log.Warn().Str("email", user.Email).Msg("GoogleAuth: login denied — account blocked")
		utils.WriteError(w, http.StatusForbidden, "ACCOUNT_BLOCKED", "Your account has been blocked")
		return
	}

	accessToken, err := utils.GenerateAccessToken(user)
	if err != nil {
		log.Error().Err(err).Msg("GoogleAuth: failed to generate access token")
		utils.WriteError(w, http.StatusInternalServerError, "TOKEN_ERROR", "Failed to generate token")
		return
	}

	// Generate refresh token
	refreshToken, err := utils.GenerateRefreshToken(user)
	if err != nil {
		log.Error().Err(err).Msg("GoogleAuth: failed to generate refresh token")
	} else {
		user.RefreshToken = refreshToken
		if err := db.DB.Save(user).Error; err != nil {
			log.Error().Err(err).Msg("GoogleAuth: failed to save refresh token")
		} else {
			http.SetCookie(w, &http.Cookie{
				Name:     "refresh_token",
				Value:    refreshToken,
				HttpOnly: true,
				Path:     "/",
				MaxAge:   7 * 24 * 3600,
				Secure:   false,
				SameSite: http.SameSiteLaxMode,
			})
		}
	}

	log.Info().Str("email", user.Email).Msg("GoogleAuth: user authenticated successfully")

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status":       "authenticated",
		"access_token": accessToken,
	})
}
