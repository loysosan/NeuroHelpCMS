package utils

import (
	"errors"
	"time"
	"user-api/internal/models"

	"github.com/go-ini/ini"
	"github.com/golang-jwt/jwt/v4"
	"github.com/rs/zerolog/log"
)

// Structure for access token claims
type AccessClaims struct {
	Username string `json:"username"`
	Role     string `json:"role"`
	jwt.RegisteredClaims
}

// Structure for refresh token claims
type RefreshClaims struct {
	Username string `json:"username"`
	jwt.RegisteredClaims
}

var cfg *ini.File

func init() {
	var err error
	cfg, err = ini.Load("config.ini")
	if err != nil {
		log.Fatal().Err(err).Msg("Failed to load config.ini")
	}
}

// Parse and validate access token
func ParseAccessToken(tokenStr string) (*AccessClaims, error) {
	claims := &AccessClaims{}
	token, err := jwt.ParseWithClaims(tokenStr, claims, func(token *jwt.Token) (interface{}, error) {
		return []byte(cfg.Section("auth").Key("jwt_user_secret").String()), nil
	})
	if err != nil || !token.Valid {
		return nil, errors.New("invalid access token")
	}
	return claims, nil
}

// Parse and validate refresh token
func ParseRefreshToken(tokenStr string) (*RefreshClaims, error) {
	claims := &RefreshClaims{}
	token, err := jwt.ParseWithClaims(tokenStr, claims, func(token *jwt.Token) (interface{}, error) {
		return []byte(cfg.Section("auth").Key("jwt_user_refresh_secret").String()), nil
	})
	if err != nil || !token.Valid {
		return nil, errors.New("invalid refresh token")
	}
	return claims, nil
}

// Generate access token
func GenerateAccessToken(user *models.User) (string, error) {
	claims := AccessClaims{
		Username: user.Email,
		Role:     user.Role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(cfg.Section("auth").Key("jwt_user_secret").String()))
}

// Generate refresh token
func GenerateRefreshToken(user *models.User) (string, error) {
	claims := RefreshClaims{
		Username: user.Email,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(7 * 24 * time.Hour)), // 7 days
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(cfg.Section("auth").Key("jwt_refresh_secret").String()))
}
