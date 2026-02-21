package handlers

import (
	"encoding/json"
	"net/http"
	"user-api/internal/db"
	"user-api/internal/models"
	"user-api/internal/utils"

	"strings"
	"time"

	"github.com/golang-jwt/jwt/v4"
	"github.com/rs/zerolog/log"
	"golang.org/x/crypto/bcrypt"
)

type Credentials struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type Claims struct {
	Username string `json:"username"`
	Role     string `json:"role"`
	jwt.RegisteredClaims
}

// Admin Login godoc
// @Summary      Authorize admin user
// @Description  Authorize admin user
// @Tags         Login for user and admin
// @Accept       json
// @Produce      json
// @Param        user body Credentials true "User data"
// @Success      201 {object} map[string]interface{}
// @Failure      400 {object} map[string]interface{}
// @Router       /api/admin/login [post]
func AdminLogin(w http.ResponseWriter, r *http.Request) {
	var creds Credentials
	if err := json.NewDecoder(r.Body).Decode(&creds); err != nil {
		http.Error(w, "Invalid request format", http.StatusBadRequest)
		return
	}

	var admin models.Administrator
	if err := db.DB.Where("username = ?", creds.Username).First(&admin).Error; err != nil {
		log.Warn().Str("username", creds.Username).Msg("Admin login failed: admin not found")
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(admin.Password), []byte(creds.Password)); err != nil {
		log.Warn().Str("username", creds.Username).Msg("Admin login failed: invalid password")
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	// Generate access token
	expirationTime := time.Now().Add(24 * time.Hour)
	claims := &Claims{
		Username: admin.Username,
		Role:     admin.Role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	accessToken, err := token.SignedString(jwtKey)
	if err != nil {
		http.Error(w, "Failed to generate token", http.StatusInternalServerError)
		return
	}

	// Generate refresh token for admin
	refreshTokenClaims := &Claims{
		Username: admin.Username,
		Role:     admin.Role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(7 * 24 * time.Hour)), // 7 days
		},
	}

	refreshTokenJWT := jwt.NewWithClaims(jwt.SigningMethodHS256, refreshTokenClaims)
	refreshToken, err := refreshTokenJWT.SignedString(jwtKey)
	if err != nil {
		log.Error().Err(err).Msg("Failed to generate admin refresh token")
		// Continue without refresh token for now
	} else {
		// Save refresh token to admin record
		admin.RefreshToken = refreshToken
		if err := db.DB.Save(&admin).Error; err != nil {
			log.Error().Err(err).Msg("Failed to save admin refresh token")
		} else {
			// Set refresh token cookie
			http.SetCookie(w, &http.Cookie{
				Name:     "admin_refresh_token",
				Value:    refreshToken,
				HttpOnly: true,
				Path:     "/",
				MaxAge:   7 * 24 * 3600, // 7 days
				Secure:   false,         // set to true for HTTPS
				SameSite: http.SameSiteLaxMode,
			})
		}
	}

	log.Info().Str("username", admin.Username).Msg("Admin login successful")

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"token": accessToken,
		"user": map[string]interface{}{
			"username": admin.Username,
			"role":     admin.Role,
		},
	})
}

// UserLogin godoc
// @Summary      Authorize normal user
// @Description  Authorize normal user
// @Tags         Login for user and admin
// @Accept       json
// @Produce      json
// @Param        user body Credentials true "User data"
// @Success      201 {object} map[string]interface{}
// @Failure      400 {object} map[string]interface{}
// @Router       /api/login [post]
func UserLogin(w http.ResponseWriter, r *http.Request) {
	var creds Credentials
	if err := json.NewDecoder(r.Body).Decode(&creds); err != nil {
		http.Error(w, "Invalid request format", http.StatusBadRequest)
		return
	}

	var user models.User
	if err := db.DB.Where("email = ?", creds.Username).First(&user).Error; err != nil {
		log.Warn().Str("email", creds.Username).Msg("User login failed: user not found")
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(creds.Password)); err != nil {
		log.Warn().Str("email", creds.Username).Msg("User login failed: invalid password")
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	if user.Status == "Blocked" {
		log.Warn().Str("email", creds.Username).Msg("User login failed: account blocked")
		utils.WriteError(w, http.StatusForbidden, "ACCOUNT_BLOCKED", "Your account has been blocked")
		return
	}

	// Generate access token
	expirationTime := time.Now().Add(24 * time.Hour)
	claims := &Claims{
		Username: user.Email,
		Role:     user.Role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	accessToken, err := token.SignedString(jwtUserKey)
	if err != nil {
		http.Error(w, "Failed to generate token", http.StatusInternalServerError)
		return
	}

	// Generate refresh token
	refreshToken, err := utils.GenerateRefreshToken(&user)
	if err != nil {
		log.Error().Err(err).Msg("Failed to generate refresh token")
		// Continue without refresh token for now
	} else {
		// Save refresh token to DB
		user.RefreshToken = refreshToken
		if err := db.DB.Save(&user).Error; err != nil {
			log.Error().Err(err).Msg("Failed to save refresh token")
		} else {
			// Set refresh token cookie
			http.SetCookie(w, &http.Cookie{
				Name:     "refresh_token",
				Value:    refreshToken,
				HttpOnly: true,
				Path:     "/",
				MaxAge:   7 * 24 * 3600, // 7 days
				Secure:   false,         // set to true for HTTPS
				SameSite: http.SameSiteLaxMode,
			})
		}
	}

	log.Info().Str("email", creds.Username).Msg("User login successful")

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"access_token": accessToken})
}

// RefreshToken godoc
// @Summary      Refresh access token
// @Description  Refreshes access token using refresh token
// @Tags         Auth
// @Accept       json
// @Produce      json
// @Success      200 {object} map[string]interface{}
// @Failure      401 {object} map[string]interface{}
// @Router       /api/auth/refresh [post]
func RefreshToken(w http.ResponseWriter, r *http.Request) {
	cookie, err := r.Cookie("refresh_token")
	if err != nil {
		utils.WriteError(w, http.StatusUnauthorized, "NO_REFRESH_TOKEN", "No refresh token")
		return
	}
	refreshToken := cookie.Value

	// Validate refresh token (JWT or random string)
	claims, err := utils.ParseRefreshToken(refreshToken)
	if err != nil {
		utils.WriteError(w, http.StatusUnauthorized, "INVALID_REFRESH_TOKEN", "Invalid refresh token")
		return
	}

	// Check if user exists and refresh token matches the one in DB
	var user models.User
	if err := db.DB.Where("email = ?", claims.Username).First(&user).Error; err != nil || user.RefreshToken != refreshToken {
		utils.WriteError(w, http.StatusUnauthorized, "INVALID_REFRESH_TOKEN", "Invalid refresh token")
		return
	}

	// Generate new access token
	accessToken, err := utils.GenerateAccessToken(&user)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "TOKEN_ERROR", "Failed to generate access token")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"access_token": accessToken,
	})
}

// AdminRefreshToken godoc
// @Summary      Refresh admin access token
// @Description  Refreshes admin access token using refresh token from cookies
// @Tags         Admin Auth
// @Accept       json
// @Produce      json
// @Success      200 {object} map[string]interface{}
// @Failure      401 {object} map[string]interface{}
// @Router       /api/admin/refresh [post]
func AdminRefreshToken(w http.ResponseWriter, r *http.Request) {
	// Получаем refresh token из cookies
	refreshCookie, err := r.Cookie("admin_refresh_token")
	if err != nil {
		log.Warn().Msg("AdminRefreshToken: No refresh token cookie")
		http.Error(w, "No refresh token", http.StatusUnauthorized)
		return
	}

	refreshToken := refreshCookie.Value
	claims := &Claims{}
	token, err := jwt.ParseWithClaims(refreshToken, claims, func(t *jwt.Token) (interface{}, error) {
		return jwtKey, nil
	})

	if err != nil || !token.Valid {
		log.Warn().Err(err).Msg("AdminRefreshToken: Invalid refresh token")
		http.Error(w, "Invalid refresh token", http.StatusUnauthorized)
		return
	}

	// Проверяем что это админ
	if claims.Role != "admin" {
		log.Warn().Str("role", claims.Role).Msg("AdminRefreshToken: Not an admin")
		http.Error(w, "Not an admin", http.StatusForbidden)
		return
	}

	// Проверяем что админ существует и refresh token совпадает
	var admin models.Administrator
	if err := db.DB.Where("username = ? AND refresh_token = ?", claims.Username, refreshToken).First(&admin).Error; err != nil {
		log.Warn().Str("username", claims.Username).Msg("AdminRefreshToken: Admin not found or token mismatch")
		http.Error(w, "Invalid refresh token", http.StatusUnauthorized)
		return
	}

	// Генерируем новый access token
	expirationTime := time.Now().Add(24 * time.Hour)
	newClaims := &Claims{
		Username: admin.Username,
		Role:     admin.Role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
		},
	}

	newToken := jwt.NewWithClaims(jwt.SigningMethodHS256, newClaims)
	accessToken, err := newToken.SignedString(jwtKey)
	if err != nil {
		log.Error().Err(err).Msg("AdminRefreshToken: Failed to generate new access token")
		http.Error(w, "Failed to generate token", http.StatusInternalServerError)
		return
	}

	log.Info().Str("username", admin.Username).Msg("AdminRefreshToken: Token refreshed successfully")

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"token": accessToken,
	})
}

// VerifyAdminToken godoc
// @Summary      Verify admin token
// @Description  Verify admin token validity
// @Tags         Admin Auth
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Success      200 {object} map[string]interface{}
// @Failure      401 {object} map[string]interface{}
// @Router       /api/admin/verify [get]
func VerifyAdminToken(w http.ResponseWriter, r *http.Request) {
	tokenHeader := r.Header.Get("Authorization")
	if tokenHeader == "" {
		http.Error(w, "No token provided", http.StatusUnauthorized)
		return
	}

	tokenStr := tokenHeader
	if strings.HasPrefix(tokenHeader, "Bearer ") {
		tokenStr = strings.TrimPrefix(tokenHeader, "Bearer ")
	}

	claims := &Claims{}
	token, err := jwt.ParseWithClaims(tokenStr, claims, func(t *jwt.Token) (interface{}, error) {
		// Используем тот же ключ что и в AdminLogin
		return jwtKey, nil
	})

	if err != nil || !token.Valid {
		log.Warn().Err(err).Msg("VerifyAdminToken: Invalid token")
		http.Error(w, "Invalid token", http.StatusUnauthorized)
		return
	}

	// Проверяем роль админа
	if claims.Role != "admin" {
		log.Warn().Str("role", claims.Role).Msg("VerifyAdminToken: Not an admin")
		http.Error(w, "Not an admin", http.StatusForbidden)
		return
	}

	// Проверяем что админ существует в базе
	var admin models.Administrator
	if err := db.DB.Where("username = ?", claims.Username).First(&admin).Error; err != nil {
		log.Warn().Str("username", claims.Username).Msg("VerifyAdminToken: Admin not found")
		http.Error(w, "Admin not found", http.StatusUnauthorized)
		return
	}

	log.Info().Str("username", claims.Username).Msg("VerifyAdminToken: Token verified successfully")

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"valid": true,
		"user": map[string]interface{}{
			"username": claims.Username,
			"role":     claims.Role,
		},
	})
}
