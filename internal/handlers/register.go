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

// RegisterRequest defines the structure for the registration request,
// including user and portfolio data.
type RegisterRequest struct {
	// Embedded User struct for user fields
	models.User

	// Fields for the psychologist's portfolio
	Telegram         *string `json:"telegram"`
	InstagramURL     *string `json:"instagram"`
	City             *string `json:"city"`
	Address          *string `json:"street"` // Frontend sends 'street'
	FullDescription  *string `json:"fullDescription"`
	ShortDescription *string `json:"shortDescription"` // Can be mapped to Description
	VideoURL         *string `json:"videoUrl"`

	// Fields for the client's child
	ChildAge     *int    `json:"childAge"` // Changed from *uint to *int
	ChildGender  *string `json:"childGender"`
	ChildProblem *string `json:"childProblem"`

	// Google OAuth field
	GoogleID *string `json:"googleId"`
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

	user := req.User // Get user data from the request

	// If registering via Google OAuth, set GoogleID on user
	isOAuth := req.GoogleID != nil && *req.GoogleID != ""
	if isOAuth {
		user.GoogleID = *req.GoogleID
	}

	// Validate and create the user
	if !processUserCreation(w, &user) {
		return // Error has already been written in processUserCreation
	}

	// For OAuth users: auto-verify and activate
	if isOAuth {
		user.Verified = true
		user.Status = "Active"
		if err := db.DB.Save(&user).Error; err != nil {
			log.Error().Err(err).Msg("RegisterUser: failed to activate OAuth user")
		}
	}

	// If the user is a psychologist, find and update their portfolio
	if user.Role == "psychologist" {
		err := db.DB.Transaction(func(tx *gorm.DB) error {
			var portfolio models.Portfolio
			// Find the portfolio, which was likely created automatically.
			// If it doesn't exist, create a new one.
			if err := tx.Where(models.Portfolio{PsychologistID: user.ID}).FirstOrCreate(&portfolio).Error; err != nil {
				log.Error().Err(err).Msg("RegisterUser: failed to find or create portfolio")
				return err
			}

			// Update portfolio fields with data from the request
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

			// Save the updated portfolio
			if err := tx.Save(&portfolio).Error; err != nil {
				log.Error().Err(err).Msg("RegisterUser: failed to update portfolio")
				return err
			}

			return nil // Commit the transaction
		})

		if err != nil {
			// If the transaction failed, delete the user for consistency
			db.DB.Delete(&user)
			utils.WriteError(w, http.StatusInternalServerError, "DB_ERROR", "Failed to process psychologist portfolio")
			return
		}
	}

	// If the user is a client, create a child record
	if user.Role == "client" {
		child := models.Child{
			ClientID: user.ID, // Link child to the client user
		}

		// Set age if provided
		if req.ChildAge != nil {
			child.Age = *req.ChildAge
		} else {
			child.Age = 0 // Default value for age if not provided
		}

		// Set gender if provided
		if req.ChildGender != nil {
			child.Gender = *req.ChildGender
		} else {
			child.Gender = "notspecified" // Default value as per model enum
		}

		// Set problem description if provided
		if req.ChildProblem != nil {
			child.Problem = *req.ChildProblem
		} else {
			child.Problem = "" // Set empty string if no problem description provided
		}

		if err := db.DB.Create(&child).Error; err != nil {
			log.Error().Err(err).Msg("RegisterUser: failed to create child record")
			// If child creation failed, delete the user for consistency
			db.DB.Delete(&user)
			utils.WriteError(w, http.StatusInternalServerError, "DB_ERROR", "Failed to create child profile")
			return
		}

		log.Info().Uint64("childId", child.ID).Str("userEmail", user.Email).Msg("RegisterUser: child record created successfully")
	}

	log.Info().Str("email", user.Email).Str("role", user.Role).Bool("oauth", isOAuth).Msg("RegisterUser: user successfully registered")

	// Skip email verification for OAuth users (already verified by Google)
	if !isOAuth {
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
