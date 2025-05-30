package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"
	"user-api/internal/db"
	"user-api/internal/models"
	"user-api/internal/utils"

	"github.com/go-chi/chi/v5"
	"github.com/go-ini/ini"
	"github.com/rs/zerolog/log"
	"golang.org/x/crypto/bcrypt"
)

var cfg *ini.File

func init() {
	var err error
	cfg, err = ini.Load("config.ini")
	if err != nil {
		log.Fatal().Err(err).Msg("Failed to load config.ini")
	}
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
    return true
}

// CreateUser godoc
// @Summary      Create user
// @Description  Add new user (client or psychologist)
// @Tags         users
// @Accept       json
// @Produce      json
// @Param        user body models.User true "User data"
// @Success      201 {object} map[string]interface{}
// @Failure      400 {object} map[string]interface{}
// @Router       /users [post]
// @Security BearerAuth
func CreateUser(w http.ResponseWriter, r *http.Request) {
	var user models.User
	if err := json.NewDecoder(r.Body).Decode(&user); err != nil {
		log.Warn().Msg("CreateUser: invalid JSON format")
		utils.WriteError(w, http.StatusBadRequest, "INVALID_JSON", "Incorrect request format")
		return
	}

	if !processUserCreation(w, &user) {
		return
	}

	log.Info().Str("email", user.Email).Str("role", user.Role).Msg("CreateUser: user successfully created")

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    user,
	})
}

// RegisterUser godoc
// @Summary      Register user
// @Description  Add new user (client or psychologist) without authentication
// @Tags         users
// @Accept       json
// @Produce      json
// @Param        user body models.User true "User data"
// @Success      201 {object} map[string]interface{}
// @Failure      400 {object} map[string]interface{}
// @Router       /register [post]
func RegisterUser(w http.ResponseWriter, r *http.Request) {
    var user models.User
    if err := json.NewDecoder(r.Body).Decode(&user); err != nil {
        log.Warn().Msg("RegisterUser: invalid JSON format")
        utils.WriteError(w, http.StatusBadRequest, "INVALID_JSON", "Incorrect request format")
        return
    }
    if !processUserCreation(w, &user) {
        return
    }
    log.Info().Str("email", user.Email).Str("role", user.Role).Msg("RegisterUser: user successfully registered")

    // Send registration email
    err := utils.SendTemplatedEmail(utils.SendTemplatedEmailParams{
        To:           user.Email,
        Subject:      "Welcome to our service",
        TemplatePath: cfg.Section("email").Key("template_path").String(),
        SMTPHost:     cfg.Section("email").Key("smtp_host").String(),
        SMTPPort:     cfg.Section("email").Key("smtp_port").String(),
        SMTPUser:     cfg.Section("email").Key("smtp_user").String(),
        SMTPPass:     cfg.Section("email").Key("smtp_pass").String(),
        FromEmail:    cfg.Section("email").Key("from_email").String(),
        Data:         user,
    })
    if err != nil {
        log.Error().Err(err).Msg("RegisterUser: failed to send registration email")
    }

    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(http.StatusCreated)
    json.NewEncoder(w).Encode(map[string]interface{}{
        "success": true,
        "data":    user,
    })
}

// GetUser godoc
// @Summary      Отримати користувача
// @Description  Повертає користувача за ID
// @Tags         users
// @Produce      json
// @Param        id path int true "User ID"
// @Success      200 {object} models.User
// @Failure      404 {object} map[string]interface{}
// @Router       /users/{id} [get]
// @Security BearerAuth
func GetUser(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.Atoi(chi.URLParam(r, "id"))
	var user models.User
	result := db.DB.First(&user, id)
	if result.Error != nil {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(user)
}

// GetAllUsers godoc
// @Summary      Отримати всіх користувачів
// @Description  Повертає список усіх користувачів
// @Tags         users
// @Produce      json
// @Success      200 {array} models.User
// @Router       /users [get]
// @Security BearerAuth
func GetAllUsers(w http.ResponseWriter, r *http.Request) {
	var users []models.User
	db.DB.Find(&users)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(users)
}