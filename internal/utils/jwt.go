package utils

import (
    "github.com/golang-jwt/jwt/v4"
    "errors"
    "time"
    "user-api/internal/models"
)

// Структура для claims refresh токена
type RefreshClaims struct {
    Username string `json:"username"`
    jwt.RegisteredClaims
}

// Парсинг та перевірка refresh токена
func ParseRefreshToken(tokenStr string) (*RefreshClaims, error) {
    claims := &RefreshClaims{}
    token, err := jwt.ParseWithClaims(tokenStr, claims, func(token *jwt.Token) (interface{}, error) {
        return []byte("YOUR_REFRESH_SECRET"), nil // замініть на ваш секрет
    })
    if err != nil || !token.Valid {
        return nil, errors.New("invalid refresh token")
    }
    return claims, nil
}

// Генерація access токена
func GenerateAccessToken(user *models.User) (string, error) {
    claims := jwt.MapClaims{
        "username": user.Email,
        "role":     user.Role,
        "exp":      time.Now().Add(15 * time.Minute).Unix(),
    }
    token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
    return token.SignedString([]byte("YOUR_ACCESS_SECRET")) // замініть на ваш секрет
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
    return token.SignedString([]byte("YOUR_REFRESH_SECRET")) // замініть на ваш секрет
}

