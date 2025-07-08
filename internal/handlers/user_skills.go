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

// SetSpecialistSkills godoc
// @Summary      Set psychologist skills
// @Description  Allows a psychologist to select their skills from available ones
// @Tags         Actions for users
// @Accept       json
// @Produce      json
// @Param        skills body []uint64 true "Array of skill IDs"
// @Success      200 {object} map[string]interface{}
// @Failure      400,401,403,404,500 {object} map[string]interface{}
// @Router       /api/users/self/skills [put]
// @Security     BearerAuth
func SetSpecialistSkills(w http.ResponseWriter, r *http.Request) {
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

	if user.Role != "psychologist" {
		utils.WriteError(w, http.StatusForbidden, "FORBIDDEN", "Only psychologists can set skills")
		return
	}

	var skillIDs []uint64
	if err := json.NewDecoder(r.Body).Decode(&skillIDs); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "INVALID_FORMAT", "Invalid request format")
		return
	}

	// Verify all skill IDs exist
	var skills []models.Skill
	if err := db.DB.Where("id IN ?", skillIDs).Find(&skills).Error; err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "DB_ERROR", "Failed to verify skills")
		return
	}

	if len(skills) != len(skillIDs) {
		utils.WriteError(w, http.StatusBadRequest, "INVALID_SKILLS", "Some skill IDs are invalid")
		return
	}

	// Clear existing skills and set new ones
	if err := db.DB.Model(&user).Association("Skills").Replace(skills); err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "DB_ERROR", "Failed to update skills")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "Skills updated successfully",
		"data":    skills,
	})
}

// GetAllSkillsByCategory godoc
// @Summary      Get all skills with categories
// @Description  Returns all skills grouped by categories
// @Tags         Actions for users
// @Produce      json
// @Success      200 {array} map[string]interface{}
// @Failure      500 {object} map[string]interface{}
// @Router       /api/users/skills [get]
func GetAllSkillsByCategory(w http.ResponseWriter, r *http.Request) {
	var skills []models.Skill
	if err := db.DB.Preload("Category").Find(&skills).Error; err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "DB_ERROR", "Failed to fetch skills")
		return
	}

	// Group skills by category
	categoryMap := make(map[string][]models.Skill)
	for _, skill := range skills {
		categoryName := skill.Category.Name
		categoryMap[categoryName] = append(categoryMap[categoryName], skill)
	}

	// Convert to response format
	var response []map[string]interface{}
	for categoryName, categorySkills := range categoryMap {
		response = append(response, map[string]interface{}{
			"category": categoryName,
			"skills":   categorySkills,
		})
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// GetUserSkills godoc
// @Summary      Get all user skills
// @Description  Returns all skills assigned to a specific user
// @Tags         Actions for users
// @Produce      json
// @Param        user_id path int true "User ID"
// @Success      200 {array} models.Skill
// @Failure      404,500 {object} map[string]interface{}
// @Router       /api/users/{user_id}/skills [get]
func GetUserSkills(w http.ResponseWriter, r *http.Request) {
	userID, err := strconv.ParseUint(chi.URLParam(r, "user_id"), 10, 64)
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, "INVALID_ID", "Invalid user ID")
		return
	}

	var user models.User
	if err := db.DB.Preload("Skills").Preload("Skills.Category").Where("id = ?", userID).First(&user).Error; err != nil {
		utils.WriteError(w, http.StatusNotFound, "NOT_FOUND", "User not found")
		return
	}

	if user.Role != "psychologist" {
		utils.WriteError(w, http.StatusBadRequest, "INVALID_ROLE", "Only psychologists have skills")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(user.Skills)
}
