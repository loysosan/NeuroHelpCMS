package handlers

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"net/http"
	"time"

	"user-api/internal/db"
	"user-api/internal/models"
	"user-api/internal/utils"

	"github.com/go-ini/ini"
	"github.com/rs/zerolog/log"
	"golang.org/x/crypto/bcrypt"
)

// Global configuration variable
var cfg *ini.File
var jwtKey []byte
var jwtUserKey []byte

func init() {
	var err error
	cfg, err = ini.Load("config.ini")
	if err != nil {
		log.Fatal().Err(err).Msg("Failed to load config.ini")
	}
	jwtKey = []byte(cfg.Section("auth").Key("jwt_admin_secret").String())
	jwtUserKey = []byte(cfg.Section("auth").Key("jwt_user_secret").String())
}

// generateToken creates a secure random token of n bytes, hex-encoded.
func generateToken(n int) (string, error) {
	b := make([]byte, n)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return hex.EncodeToString(b), nil
}

// processUserCreation centralizes validation, password hashing, existence check, and DB creation.
// Returns true if user was created successfully, false if a response has already been written.
func processUserCreation(w http.ResponseWriter, user *models.User) bool {
	// Role Validation
	if user.Role != "client" && user.Role != "psychologist" {
		log.Warn().Str("role", user.Role).Msg("processUserCreation: invalid role")
		utils.WriteError(w, http.StatusBadRequest, "INVALID_ROLE", "Role must be 'client' or 'psychologist'")
		return false
	}
	// Password hashing
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)
	if err != nil {
		log.Error().Err(err).Msg("processUserCreation: password hashing failed")
		utils.WriteError(w, http.StatusInternalServerError, "HASH_ERROR", "Unable to hash password")
		return false
	}
	user.Password = string(hashedPassword)
	// Check existing email
	var existing models.User
	if err := db.DB.Where("email = ?", user.Email).First(&existing).Error; err == nil {
		log.Warn().Str("email", user.Email).Msg("processUserCreation: user with this email already exists")
		utils.WriteError(w, http.StatusConflict, "USER_ALREADY_EXISTS", "User with this email already exists")
		return false
	}
	// Create user in DB
	if err := db.DB.Create(user).Error; err != nil {
		log.Error().Err(err).Msg("processUserCreation: failed to create user in database")
		utils.WriteError(w, http.StatusInternalServerError, "DB_ERROR", "Unable to create user")
		return false
	}

	// Створюємо портфоліо для психолога
	if user.Role == "psychologist" {
		portfolio := models.Portfolio{
			PsychologistID: user.ID,
			Description:    "",
			ContactEmail:   nil,
			ContactPhone:   nil,
		}
		if err := db.DB.Create(&portfolio).Error; err != nil {
			log.Error().Err(err).Uint64("user_id", user.ID).Msg("processUserCreation: failed to create portfolio")
			// Не повертаємо помилку, так як користувач вже створений
		}
	}

	return true
}

// generateAndSaveVerification builds a secure token, saves it on the user, and returns the verification URL.
func generateAndSaveVerification(user *models.User) (string, error) {
	token, err := generateToken(32)
	if err != nil {
		return "", err
	}
	user.VerificationToken = token
	user.TokenSentAt = time.Now()
	if err := db.DB.Save(user).Error; err != nil {
		return "", err
	}
	verifyURL := fmt.Sprintf("%s/verify?token=%s",
		cfg.Section("app").Key("frontend_url").String(),
		token,
	)
	return verifyURL, nil
}