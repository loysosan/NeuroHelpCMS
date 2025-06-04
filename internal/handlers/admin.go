package handlers

import (
	"encoding/json"
	"net/http"
	"user-api/internal/db"
	"user-api/internal/models"

	"user-api/internal/utils"
	"github.com/go-chi/chi/v5"
	"strconv"

	"github.com/rs/zerolog/log"

)


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

// CreateSkill godoc
// @Summary      Create a new skill
// @Description  Add a new skill (admin only)
// @Tags         Actions for administrators
// @Accept       json
// @Produce      json
// @Param        skill body models.Skill true "Skill data"
// @Success      201 {object} map[string]interface{}
// @Failure      400,409,500 {object} map[string]interface{}
// @Router       /admin/skills [post]
// @Security     BearerAuth
func CreateSkill(w http.ResponseWriter, r *http.Request) {
    var skill models.Skill
    if err := json.NewDecoder(r.Body).Decode(&skill); err != nil {
        utils.WriteError(w, http.StatusBadRequest, "INVALID_JSON", "Incorrect request format")
        return
    }

    // Check if skill with the same name already exists
    var existing models.Skill
    if err := db.DB.Where("name = ?", skill.Name).First(&existing).Error; err == nil {
        utils.WriteError(w, http.StatusConflict, "SKILL_EXISTS", "Skill with this name already exists")
        return
    }

    if err := db.DB.Create(&skill).Error; err != nil {
        utils.WriteError(w, http.StatusInternalServerError, "DB_ERROR", "Unable to create skill")
        return
    }

    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(http.StatusCreated)
    json.NewEncoder(w).Encode(map[string]interface{}{
        "success": true,
        "data":    skill,
    })
}

// GetSkills godoc
// @Summary      Get all skills
// @Description  Retrieve all available skills (admin only)
// @Tags         Actions for administrators
// @Produce      json
// @Success      200 {array} models.Skill
// @Failure      500 {object} map[string]interface{}
// @Router       /admin/skills [get]
// @Security     BearerAuth
func GetSkills(w http.ResponseWriter, r *http.Request) {
    var skills []models.Skill
    if err := db.DB.Find(&skills).Error; err != nil {
        utils.WriteError(w, http.StatusInternalServerError, "DB_ERROR", "Unable to retrieve skills")
        return
    }

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(skills)
}

// CreateSkillCategory godoc
// @Summary      Create a new skill category
// @Description  Add a new skill category (admin only)
// @Tags         Actions for administrators
// @Accept       json
// @Produce      json
// @Param        category body models.Category true "Category data"
// @Success      201 {object} map[string]interface{}
// @Failure      400,409,500 {object} map[string]interface{}
// @Router       /admin/skills/categories [post]
// @Security     BearerAuth
func CreateSkillCategory(w http.ResponseWriter, r *http.Request) {
    var category models.Category
    if err := json.NewDecoder(r.Body).Decode(&category); err != nil {
        utils.WriteError(w, http.StatusBadRequest, "INVALID_JSON", "Incorrect request format")
        return
    }

    // Check if category with the same name already exists
    var existing models.Category
    if err := db.DB.Where("name = ?", category.Name).First(&existing).Error; err == nil {
        utils.WriteError(w, http.StatusConflict, "CATEGORY_EXISTS", "Category with this name already exists")
        return
    }

    if err := db.DB.Create(&category).Error; err != nil {
        utils.WriteError(w, http.StatusInternalServerError, "DB_ERROR", "Unable to create category")
        return
    }

    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(http.StatusCreated)
    json.NewEncoder(w).Encode(map[string]interface{}{
        "success": true,
        "data":    category,
    })
}

// GetSkillCategories godoc
// @Summary      Get all skill categories
// @Description  Retrieve all available skill categories (admin only)
// @Tags         Actions for administrators
// @Produce      json
// @Success      200 {array} models.Category
// @Failure      500 {object} map[string]interface{}
// @Router       /admin/skills/categories [get]
// @Security     BearerAuth
func GetSkillCategories(w http.ResponseWriter, r *http.Request) {
    var categories []models.Category
    if err := db.DB.Find(&categories).Error; err != nil {
        utils.WriteError(w, http.StatusInternalServerError, "DB_ERROR", "Unable to retrieve categories")
        return
    }

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(categories)
}