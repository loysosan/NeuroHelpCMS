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
	if err := db.DB.Preload("Portfolio").Preload("Portfolio.Photos").Preload("Portfolio.Educations").Preload("Skills").Preload("Skills.Category").Preload("Child").Where("email = ?", email).First(&user).Error; err != nil {
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
			"educations":   user.Portfolio.Educations,
			"contactEmail": user.Portfolio.ContactEmail,
			"contactPhone": user.Portfolio.ContactPhone,
			"city":         user.Portfolio.City,
			"address":      user.Portfolio.Address,
			"dateOfBirth":  user.Portfolio.DateOfBirth,
			"gender":       user.Portfolio.Gender,
			"telegram":     user.Portfolio.Telegram,
			"facebookURL":  user.Portfolio.FacebookURL,
			"instagramURL": user.Portfolio.InstagramURL,
			"videoURL":     user.Portfolio.VideoURL,
			"rate":         user.Portfolio.Rate,
			"clientAgeMin": user.Portfolio.ClientAgeMin,
			"clientAgeMax": user.Portfolio.ClientAgeMax,
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

	if user.Role == "client" && user.Child.ID != 0 {
		response["child"] = map[string]interface{}{
			"id":      user.Child.ID,
			"age":     user.Child.Age,
			"gender":  user.Child.Gender,
			"problem": user.Child.Problem,
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// GetSelfChild godoc
// @Summary      Get own child data
// @Description  Returns the authenticated client's child information
// @Tags         Actions for users
// @Produce      json
// @Success      200 {object} map[string]interface{}
// @Failure      401,403,404 {object} map[string]interface{}
// @Router       /api/users/self/child [get]
// @Security     BearerAuth
func GetSelfChild(w http.ResponseWriter, r *http.Request) {
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

	if user.Role != "client" {
		utils.WriteError(w, http.StatusForbidden, "FORBIDDEN", "Only clients can access child data")
		return
	}

	var child models.Child
	if err := db.DB.Where("client_id = ?", user.ID).First(&child).Error; err != nil {
		// No child record — return empty
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": true,
			"data":    nil,
		})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data": map[string]interface{}{
			"id":      child.ID,
			"age":     child.Age,
			"gender":  child.Gender,
			"problem": child.Problem,
		},
	})
}

// UpdateSelfChild godoc
// @Summary      Update or create child data
// @Description  Allows a client to update or create their child information
// @Tags         Actions for users
// @Accept       json
// @Produce      json
// @Param        child body map[string]interface{} true "Child data"
// @Success      200 {object} map[string]interface{}
// @Failure      400,401,403,500 {object} map[string]interface{}
// @Router       /api/users/self/child [put]
// @Security     BearerAuth
func UpdateSelfChild(w http.ResponseWriter, r *http.Request) {
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

	if user.Role != "client" {
		utils.WriteError(w, http.StatusForbidden, "FORBIDDEN", "Only clients can manage child data")
		return
	}

	var updateData struct {
		Age     *int    `json:"age"`
		Gender  *string `json:"gender"`
		Problem *string `json:"problem"`
	}
	if err := json.NewDecoder(r.Body).Decode(&updateData); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "INVALID_FORMAT", "Invalid request format")
		return
	}

	var child models.Child
	result := db.DB.Where("client_id = ?", user.ID).First(&child)
	if result.Error != nil {
		// Create new child record
		child = models.Child{
			ClientID: user.ID,
			Gender:   "notspecified",
		}
	}

	if updateData.Age != nil {
		child.Age = *updateData.Age
	}
	if updateData.Gender != nil {
		child.Gender = *updateData.Gender
	}
	if updateData.Problem != nil {
		child.Problem = *updateData.Problem
	}

	if child.ID == 0 {
		if err := db.DB.Create(&child).Error; err != nil {
			utils.WriteError(w, http.StatusInternalServerError, "DB_ERROR", "Failed to create child record")
			return
		}
	} else {
		if err := db.DB.Save(&child).Error; err != nil {
			utils.WriteError(w, http.StatusInternalServerError, "DB_ERROR", "Failed to update child record")
			return
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "Child data updated successfully",
		"data": map[string]interface{}{
			"id":      child.ID,
			"age":     child.Age,
			"gender":  child.Gender,
			"problem": child.Problem,
		},
	})
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
