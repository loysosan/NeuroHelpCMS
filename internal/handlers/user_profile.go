package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"user-api/internal/db"
	"user-api/internal/models"
	"user-api/internal/utils"

	"github.com/go-chi/chi/v5"
)

// GetUserProfile godoc
// @Summary      Get selected user information
// @Description  Receive user information via ID
// @Tags         Actions for users
// @Produce      json
// @Param        id path int true "User ID"
// @Success      200 {object} models.User
// @Failure      404 {object} map[string]interface{}
// @Router       /api/users/{id} [get]
// @Security BearerAuth
func GetUserProfile(w http.ResponseWriter, r *http.Request) {
	userID, err := strconv.ParseUint(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, "INVALID_ID", "Invalid user ID")
		return
	}

	var user models.User
	if err := db.DB.Preload("Portfolio").Preload("Portfolio.Photos").Preload("Skills").Preload("Skills.Category").Where("id = ?", userID).First(&user).Error; err != nil {
		utils.WriteError(w, http.StatusNotFound, "NOT_FOUND", "User not found")
		return
	}

	// Очищуємо конфіденційні дані
	user.Password = ""
	user.RefreshToken = ""
	user.VerificationToken = ""

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(user)
}

// GetSelfProfile godoc
// @Summary      Get own profile
// @Description  Returns the authenticated user's profile information
// @Tags         Actions for users
// @Produce      json
// @Success      200 {object} models.User
// @Failure      401,404,500 {object} map[string]interface{}
// @Router       /api/users/self [get]
// @Security     BearerAuth
func GetSelfProfile(w http.ResponseWriter, r *http.Request) {
	email, ok := r.Context().Value("email").(string)
	if !ok || email == "" {
		utils.WriteError(w, http.StatusUnauthorized, "UNAUTHORIZED", "Unauthorized")
		return
	}

	var user models.User
	if err := db.DB.Preload("Portfolio").Preload("Portfolio.Educations").Preload("Skills").Preload("Skills.Category").Where("email = ?", email).First(&user).Error; err != nil {
		utils.WriteError(w, http.StatusNotFound, "NOT_FOUND", "User not found")
		return
	}

	user.Password = ""
	user.RefreshToken = ""
	user.VerificationToken = ""

	// Форматуємо навички для фронтенду
	var skills []map[string]interface{}
	for _, skill := range user.Skills {
		skills = append(skills, map[string]interface{}{
			"id":       skill.ID,
			"name":     skill.Name,
			"category": skill.Category.Name,
		})
	}

	response := map[string]interface{}{
		"id":        user.ID,
		"email":     user.Email,
		"firstName": user.FirstName,
		"lastName":  user.LastName,
		"phone":     user.Phone,
		"role":      user.Role,
		"status":    user.Status,
		"verified":  user.Verified,
		"createdAt": user.CreatedAt,
		"updatedAt": user.UpdatedAt,
		"skills":    skills,
	}

	if user.Role == "psychologist" {
		portfolioData := map[string]interface{}{
			"id":           user.Portfolio.ID,
			"description":  user.Portfolio.Description,
			"experience":   user.Portfolio.Experience,
			"educations":   user.Portfolio.Educations, // Замість "education": user.Portfolio.Education
			"contactEmail": user.Portfolio.ContactEmail,
			"contactPhone": user.Portfolio.ContactPhone,
			"city":         user.Portfolio.City,
			"address":      user.Portfolio.Address,
			"dateOfBirth":  user.Portfolio.DateOfBirth,
			"gender":       user.Portfolio.Gender,
			"telegram":     user.Portfolio.Telegram,
			"facebookURL":  user.Portfolio.FacebookURL,
			"instagramURL": user.Portfolio.InstagramURL,
			"photos":       user.Portfolio.Photos,
		}
		response["portfolio"] = portfolioData

		// Наприклад, якщо є portfolio.Education, замініть на portfolio.Educations[0].Title або обробіть як слайс
		// Якщо це для відображення, використовуйте portfolio.Educations для ітерації

		var rating *models.Rating
		if err := db.DB.Where("psychologist_id = ?", user.ID).First(&rating).Error; err == nil {
			response["rating"] = map[string]interface{}{
				"averageRating": rating.AverageRating,
				"reviewCount":   rating.ReviewCount,
			}
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// ClientSelfUpdate godoc
// @Summary      Update own profile
// @Description  Allows a client to update their personal information
// @Tags         Actions for users
// @Accept       json
// @Produce      json
// @Param        user body models.User true "Updated user data"
// @Success      200 {object} map[string]interface{}
// @Failure      400,401,403,404,500 {object} map[string]interface{}
// @Router       /api/users/self/updateuser [put]
// @Security     BearerAuth
func ClientSelfUpdate(w http.ResponseWriter, r *http.Request) {
	email, ok := r.Context().Value("email").(string)
	if !ok || email == "" {
		utils.WriteError(w, http.StatusUnauthorized, "UNAUTHORIZED", "Unauthorized")
		return
	}

	var user models.User
	if err := db.DB.Where("email = ?", email).First(&user).Error; err != nil {
		utils.WriteError(w, http.StatusNotFound, "NOT_FOUND", "User not found")
		return
	}

	// Parse request body
	var updateData struct {
		FirstName string  `json:"firstName"`
		LastName  string  `json:"lastName"`
		Phone     *string `json:"phone"`
	}
	if err := json.NewDecoder(r.Body).Decode(&updateData); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "INVALID_FORMAT", "Invalid request format")
		return
	}

	// Update user data
	user.FirstName = updateData.FirstName
	user.LastName = updateData.LastName
	user.Phone = updateData.Phone

	if err := db.DB.Save(&user).Error; err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "DB_ERROR", "Failed to update user")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "Profile updated successfully",
		"data":    user,
	})
}
