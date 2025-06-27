package handlers

import (
	"encoding/json"
	"net/http"
	"user-api/internal/db"
	"user-api/internal/models"
	"user-api/internal/utils"

	"github.com/golang-jwt/jwt/v4"
	"time"
	"golang.org/x/crypto/bcrypt"
	"github.com/rs/zerolog/log"
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
    json.NewDecoder(r.Body).Decode(&creds)

    var admin models.Administrator
    if err := db.DB.Where("username = ?", creds.Username).First(&admin).Error; err != nil {
        log.Warn().Str("username", creds.Username).Msg("Login failed: user not found")
        http.Error(w, "unauthorized", http.StatusUnauthorized)
        return
    }

    if err := bcrypt.CompareHashAndPassword([]byte(admin.Password), []byte(creds.Password)); err != nil {
        log.Warn().Str("username", creds.Username).Msg("Login failed: invalid password")
        http.Error(w, "unauthorized", http.StatusUnauthorized)
        return
    }

    expirationTime := time.Now().Add(2 * time.Hour)
    claims := &Claims{
        Username: admin.Username,
        Role:     admin.Role,
        RegisteredClaims: jwt.RegisteredClaims{
            ExpiresAt: jwt.NewNumericDate(expirationTime),
        },
    }
    token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
    tokenString, _ := token.SignedString(jwtKey)

    log.Info().Str("username", creds.Username).Msg("Login: 	Admin login successful")

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(map[string]string{"token": tokenString})
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
                Secure:   false, // set to true for HTTPS
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