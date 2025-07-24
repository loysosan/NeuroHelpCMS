package handlers

import (
	"encoding/json"
	"net/http"
	"time"
	"user-api/internal/db"
	"user-api/internal/models"
	"user-api/internal/utils"

	"github.com/rs/zerolog/log"
	"gorm.io/gorm"
)

// RegisterRequest визначає структуру для запиту на реєстрацію,
// що включає дані користувача та його портфоліо.
type RegisterRequest struct {
	// Вбудована структура User для полів користувача
	models.User

	// Поля для портфоліо психолога
	Telegram         *string `json:"telegram"`
	InstagramURL     *string `json:"instagram"`
	City             *string `json:"city"`
	Address          *string `json:"street"` // Фронтенд надсилає 'street'
	FullDescription  *string `json:"fullDescription"`
	ShortDescription *string `json:"shortDescription"` // Можна мапити в Description
	VideoURL         *string `json:"videoUrl"`
}

// RegisterUser godoc
// @Summary      Register user
// @Description  Add new user (client or psychologist) without authentication
// @Tags         Actions for users
// @Accept       json
// @Produce      json
// @Param        user body handlers.RegisterRequest true "User and Portfolio data"
// @Success      201 {object} map[string]interface{}
// @Failure      400 {object} map[string]interface{}
// @Router       /api/register [post]
func RegisterUser(w http.ResponseWriter, r *http.Request) {
	var req RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Warn().Msg("RegisterUser: invalid JSON format")
		utils.WriteError(w, http.StatusBadRequest, "INVALID_JSON", "Incorrect request format")
		return
	}

	user := req.User // Отримуємо дані користувача з запиту

	// Валідація та створення користувача
	if !processUserCreation(w, &user) {
		return // Помилка вже записана в processUserCreation
	}

	// Якщо користувач - психолог, знаходимо та оновлюємо його портфоліо
	if user.Role == "psychologist" {
		err := db.DB.Transaction(func(tx *gorm.DB) error {
			var portfolio models.Portfolio
			// Знаходимо портфоліо, яке, ймовірно, було створено автоматично.
			// Якщо його немає, створюємо нове.
			if err := tx.Where(models.Portfolio{PsychologistID: user.ID}).FirstOrCreate(&portfolio).Error; err != nil {
				log.Error().Err(err).Msg("RegisterUser: failed to find or create portfolio")
				return err
			}

			// Оновлюємо поля портфоліо даними з запиту
			portfolio.Telegram = req.Telegram
			portfolio.InstagramURL = req.InstagramURL
			portfolio.City = req.City
			portfolio.Address = req.Address
			portfolio.VideoURL = req.VideoURL

			if req.ShortDescription != nil {
				portfolio.Description = *req.ShortDescription
			} else if req.FullDescription != nil {
				portfolio.Description = *req.FullDescription
			}

			// Зберігаємо оновлене портфоліо
			if err := tx.Save(&portfolio).Error; err != nil {
				log.Error().Err(err).Msg("RegisterUser: failed to update portfolio")
				return err
			}

			return nil // Комміт транзакції
		})

		if err != nil {
			// Якщо транзакція не вдалася, видаляємо користувача для консистентності
			db.DB.Delete(&user)
			utils.WriteError(w, http.StatusInternalServerError, "DB_ERROR", "Failed to process psychologist portfolio")
			return
		}
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
			"email=" + user.Email,
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

// VerifyEmail godoc
// @Summary      Verify user email
// @Description  Confirm registration by token
// @Tags         Actions for users
// @Accept       json
// @Produce      json
// @Param        token query string true "Verification token"
// @Success      200 {object} map[string]interface{}
// @Failure      400,404,410,500 {object} map[string]interface{}
// @Router       /api/verify [get]
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
