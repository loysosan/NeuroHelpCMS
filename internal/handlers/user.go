package handlers

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"time"
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

// CreateUser godoc
// @Summary      Create user
// @Description  Add new user (client or psychologist)
// @Tags         Actions for admistrators
// @Accept       json
// @Produce      json
// @Param        user body models.User true "User data"
// @Success      201 {object} map[string]interface{}
// @Failure      400 {object} map[string]interface{}
// @Router       /admin/users [post]
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
// @Tags         Actions for users
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

	verifyURL, err := generateAndSaveVerification(&user)
	if err != nil {
		log.Error().Err(err).Msg("RegisterUser: failed to generate or save verification token")
	}

	// Send registration email
	if err := utils.SendTemplatedEmail(utils.SendTemplatedEmailParams{
		Vars: []string{
			"username=" + user.FirstName,
			"email="    + user.Email,
			"verify_link=" + verifyURL,
		},
		TemplatePath: cfg.Section("email").Key("template_path").String(),
		ToEmail:      user.Email,
		SMTPHost:     cfg.Section("email").Key("smtp_host").String(),
		SMTPPort:     cfg.Section("email").Key("smtp_port").String(),
		SMTPUser:     cfg.Section("email").Key("smtp_user").String(),
		SMTPPass:     cfg.Section("email").Key("smtp_pass").String(),
		FromEmail:    cfg.Section("email").Key("from_email").String(),
		SendType:     utils.SendSMTP,
	}); err != nil {
		log.Error().Err(err).Msg("RegisterUser: failed to send registration email")
	} else {
		log.Info().Str("email", user.Email).Msg("RegisterUser: registration email sent")
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
// @Tags         Actions for admistrators
// @Produce      json
// @Param        id path int true "User ID"
// @Success      200 {object} models.User
// @Failure      404 {object} map[string]interface{}
// @Router       /admin/users/{id} [get]
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


// GetUser godoc
// @Summary      Get selected user information
// @Description  Recive user information via ID
// @Tags         Actions for users
// @Produce      json
// @Param        id path int true "User ID"
// @Success      200 {object} models.User
// @Failure      404 {object} map[string]interface{}
// @Router       /users/{id} [get]
// @Security BearerAuth
func ClientGetUser(w http.ResponseWriter, r *http.Request) {
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
// @Tags         Actions for admistrators
// @Produce      json
// @Success      200 {array} models.User
// @Router       /admin/users [get]
// @Security BearerAuth
func GetAllUsers(w http.ResponseWriter, r *http.Request) {
	var users []models.User
	db.DB.Find(&users)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(users)
}



// VerifyEmail godoc
// @Summary      Verify user email
// @Description  Confirm registration by token
// @Tags         Actions for users
// @Accept       json
// @Produce      json
// @Param        token query string true "Verification token"
// @Success      200 {object} map[string]interface{}
// @Failure      400,404,410,500 {object} map[string]interface{}
// @Router       /verify [get]
func VerifyEmail(w http.ResponseWriter, r *http.Request) {
    token := r.URL.Query().Get("token")
    if token == "" {
        utils.WriteError(w, http.StatusBadRequest, "MISSING_TOKEN", "Token is required")
        return
    }
    var user models.User
    if err := db.DB.Where("verification_token = ?", token).First(&user).Error; err != nil {
        utils.WriteError(w, http.StatusNotFound, "INVALID_TOKEN", "Invalid or expired token")
        return
    }
    if time.Since(user.TokenSentAt) > 24*time.Hour {
        utils.WriteError(w, http.StatusGone, "TOKEN_EXPIRED", "Token has expired")
        return
    }
    user.Verified = true
    user.VerificationToken = ""
    user.Status = "Active"
    if err := db.DB.Save(&user).Error; err != nil {
        utils.WriteError(w, http.StatusInternalServerError, "DB_ERROR", "Unable to verify email")
        return
    }
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(map[string]interface{}{
        "success": true,
        "message": "Email verified successfully",
    })
}

/*************  ✨ Windsurf Command ⭐  *************/
// UpdateUser godoc
// @Summary      Update user information
// @Description  Update user's data by ID
// @Tags         Actions for admistrators
// @Accept       json
// @Produce      json
// @Param        id path int true "User ID"
// @Param        user body models.User true "Updated user data"
// @Success      200 {object} map[string]interface{}
// @Failure      400,404,500 {object} map[string]interface{}
// @Router       /admin/users/{id} [put]
// @Security BearerAuth
func UpdateUser(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.Atoi(chi.URLParam(r, "id"))
	var user models.User
	if err := db.DB.First(&user, id).Error; err != nil {
		utils.WriteError(w, http.StatusNotFound, "USER_NOT_FOUND", "User not found")
		return
	}

	var updatedUser map[string]interface{}
	if err := json.NewDecoder(r.Body).Decode(&updatedUser); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "INVALID_JSON", "Incorrect request format")
		return
	}

	for key, value := range updatedUser {
		switch key {
		case "FirstName":
			user.FirstName = value.(string)
		case "LastName":
			user.LastName = value.(string)
		case "Email":
			user.Email = value.(string)
		case "Role":
			user.Role = value.(string)
		case "Phone":
			user.Phone = value.(*string)
		case "PlanID":
			user.PlanID = value.(*uint64)
		case "Status":
			user.Status = value.(string)
		case "Portfolio":
			user.Portfolio = value.(models.Portfolio)
		case "Verified":
			user.Verified = value.(bool)
		}
	}

	if err := db.DB.Save(&user).Error; err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "DB_ERROR", "Unable to update user data")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "User data updated successfully",
	})
}