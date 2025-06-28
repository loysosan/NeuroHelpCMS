package utils

import (
    "github.com/golang-jwt/jwt/v4"
    "github.com/go-ini/ini"
    "github.com/rs/zerolog/log"
    "errors"
    "time"
    "user-api/internal/models"
)

// Структура для claims access токена
type AccessClaims struct {
    Username string `json:"username"`
    Role     string `json:"role"`
    jwt.RegisteredClaims
}

// Структура для claims refresh токена
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

// Парсинг та перевірка access токена
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

// Парсинг та перевірка refresh токена
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

// Генерація access токена
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

// Генерація refresh токена
func GenerateRefreshToken(user *models.User) (string, error) {
    claims := RefreshClaims{
        Username: user.Email,
        RegisteredClaims: jwt.RegisteredClaims{
            ExpiresAt: jwt.NewNumericDate(time.Now().Add(7 * 24 * time.Hour)), // 7 днів
            IssuedAt:  jwt.NewNumericDate(time.Now()),
        },
    }
    token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
    return token.SignedString([]byte(cfg.Section("auth").Key("jwt_refresh_secret").String()))
}

