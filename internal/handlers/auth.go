package handlers

import (
	"encoding/json"
	"net/http"
	"user-api/internal/db"
	"user-api/internal/models"

	"github.com/golang-jwt/jwt/v4"
	"time"
	"golang.org/x/crypto/bcrypt"
	"github.com/rs/zerolog/log"
)

var jwtKey = []byte("super-secret")

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
// @Summary      Autorize admin user
// @Description  Autorize admin user
// @Tags         Login for admin
// @Accept       json
// @Produce      json
// @Param        user body Credentials true "User data"
// @Success      201 {object} map[string]interface{}
// @Failure      400 {object} map[string]interface{}
// @Router       /login [post]
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