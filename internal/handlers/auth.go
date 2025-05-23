package handlers

import (
	"encoding/json"
	"net/http"
	"user-api/internal/db"
	"user-api/internal/models"

	"github.com/golang-jwt/jwt/v4"
	"time"
	"os"
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

func Login(w http.ResponseWriter, r *http.Request) {
	var creds Credentials
	json.NewDecoder(r.Body).Decode(&creds)

	var admin models.Administrator
	if err := db.DB.Where("username = ?", creds.Username).First(&admin).Error; err != nil || admin.Password != creds.Password {
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

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"token": tokenString})
}