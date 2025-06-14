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
// @Tags         Actions for administrators
// @Accept       json
// @Produce      json
// @Param        user body models.User true "User data"
// @Success      201 {object} map[string]interface{}
// @Failure      400 {object} map[string]interface{}
// @Router       /api/admin/users [post]
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

// GetAllUsers godoc
// @Summary      Get all users
// @Description  Returns a list of all users in the system
// @Tags         Actions for administrators
// @Produce      json
// @Success      200 {array} models.User
// @Router       /api/admin/users [get]
// @Security BearerAuth
func GetAllUsers(w http.ResponseWriter, r *http.Request) {
	var users []models.User
	db.DB.Find(&users)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(users)
}

// GetUser godoc
// @Summary      Get user by ID
// @Description  Retrieve user information by ID
// @Tags         Actions for administrators
// @Produce      json
// @Param        id path int true "User ID"
// @Success      200 {object} models.User
// @Failure      404 {object} map[string]interface{}
// @Router       /api/admin/users/{id} [get]
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
// @Tags         Actions for administrators
// @Accept       json
// @Produce      json
// @Param        id path int true "User ID"
// @Param        user body models.User true "Updated user data"
// @Success      200 {object} map[string]interface{}
// @Failure      400,404,500 {object} map[string]interface{}
// @Router       /api/admin/users/{id} [put]
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
            if str, ok := value.(string); ok {
                user.FirstName = str
            }
        case "LastName":
            if str, ok := value.(string); ok {
                user.LastName = str
            }
        case "Email":
            if str, ok := value.(string); ok {
                user.Email = str
            }
        case "Role":
            if str, ok := value.(string); ok {
                user.Role = str
            }
        case "Phone":
            if value == nil {
                user.Phone = nil
            } else if str, ok := value.(string); ok {
                user.Phone = &str
            }
        case "PlanID":
            if value == nil {
                user.PlanID = nil
            } else if num, ok := value.(float64); ok {
                planID := uint64(num)
                user.PlanID = &planID
            }
        case "Status":
            if str, ok := value.(string); ok {
                user.Status = str
            }
        case "Verified":
            if b, ok := value.(bool); ok {
                user.Verified = b
            }
        }
    }

    if err := db.DB.Model(&user).Updates(user).Error; err != nil {
        utils.WriteError(w, http.StatusInternalServerError, "DB_ERROR", "Unable to update user data")
        return
    }

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(map[string]interface{}{
        "success": true,
        "message": "User data updated successfully",
        "data": user,
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
// @Router       /api/admin/skills [post]
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
// @Router       /api/admin/skills [get]
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
// @Router       /api/admin/skills/categories [post]
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
// @Router       /api/admin/skills/categories [get]
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

// DeleteUser godoc
// @Summary      Delete user
// @Description  Delete user by ID (admin only)
// @Tags         Actions for administrators
// @Produce      json
// @Param        id path int true "User ID"
// @Success      200 {object} map[string]interface{}
// @Failure      404 {object} map[string]interface{}
// @Failure      500 {object} map[string]interface{}
// @Router       /api/admin/users/{id} [delete]
// @Security     BearerAuth
func DeleteUser(w http.ResponseWriter, r *http.Request) {
    // Get user ID from URL parameters
    id, err := strconv.Atoi(chi.URLParam(r, "id"))
    if err != nil {
        utils.WriteError(w, http.StatusBadRequest, "INVALID_ID", "Invalid user ID format")
        return
    }

    // Check if user exists
    var user models.User
    if err := db.DB.First(&user, id).Error; err != nil {
        utils.WriteError(w, http.StatusNotFound, "USER_NOT_FOUND", "User not found")
        return
    }

    // Delete user
    if err := db.DB.Delete(&user).Error; err != nil {
        utils.WriteError(w, http.StatusInternalServerError, "DB_ERROR", "Unable to delete user")
        return
    }

    // Return success response
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(map[string]interface{}{
        "success": true,
        "message": "User successfully deleted",
    })
}

// GetPlans godoc
// @Summary      Get all plans
// @Description  Retrieve all available plans (admin only)
// @Tags         Actions for administrators
// @Produce      json
// @Success      200 {array} models.Plan
// @Failure      500 {object} map[string]interface{}
// @Router       /api/admin/plans [get]
// @Security     BearerAuth
func GetPlans(w http.ResponseWriter, r *http.Request) {
    var plans []models.Plan
    if err := db.DB.Find(&plans).Error; err != nil {
        utils.WriteError(w, http.StatusInternalServerError, "DB_ERROR", "Unable to retrieve plans")
        return
    }

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(plans)
}

// CreatePlan godoc
// @Summary      Create a new plan
// @Description  Add a new plan (admin only)
// @Tags         Actions for administrators
// @Accept       json
// @Produce      json
// @Param        plan body models.Plan true "Plan data"
// @Success      201 {object} map[string]interface{}
// @Failure      400,409,500 {object} map[string]interface{}
// @Router       /api/admin/plans [post]
// @Security     BearerAuth
func CreatePlan(w http.ResponseWriter, r *http.Request) {
    var plan models.Plan
    if err := json.NewDecoder(r.Body).Decode(&plan); err != nil {
        utils.WriteError(w, http.StatusBadRequest, "INVALID_JSON", "Incorrect request format")
        return
    }

    // Check if plan with the same name already exists
    var existing models.Plan
    if err := db.DB.Where("name = ?", plan.Name).First(&existing).Error; err == nil {
        utils.WriteError(w, http.StatusConflict, "PLAN_EXISTS", "Plan with this name already exists")
        return
    }

    if err := db.DB.Create(&plan).Error; err != nil {
        utils.WriteError(w, http.StatusInternalServerError, "DB_ERROR", "Unable to create plan")
        return
    }

    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(http.StatusCreated)
    json.NewEncoder(w).Encode(map[string]interface{}{
        "success": true,
        "data":    plan,
    })
}

// DeletePlan godoc
// @Summary      Delete plan
// @Description  Delete plan by ID (admin only)
// @Tags         Actions for administrators
// @Produce      json
// @Param        id path int true "Plan ID"
// @Success      200 {object} map[string]interface{}
// @Failure      404 {object} map[string]interface{}
// @Failure      500 {object} map[string]interface{}
// @Router       /api/admin/plans/{id} [delete]
// @Security     BearerAuth
func DeletePlan(w http.ResponseWriter, r *http.Request) {
    // Get plan ID from URL parameters
    id, err := strconv.Atoi(chi.URLParam(r, "id"))
    if err != nil {
        utils.WriteError(w, http.StatusBadRequest, "INVALID_ID", "Invalid plan ID format")
        return
    }

    // Check if plan exists
    var plan models.Plan
    if err := db.DB.First(&plan, id).Error; err != nil {
        utils.WriteError(w, http.StatusNotFound, "PLAN_NOT_FOUND", "Plan not found")
        return
    }

    // Check if any users are using this plan
    var count int64
    if err := db.DB.Model(&models.User{}).Where("plan_id = ?", id).Count(&count).Error; err != nil {
        utils.WriteError(w, http.StatusInternalServerError, "DB_ERROR", "Unable to check plan usage")
        return
    }

    if count > 0 {
        utils.WriteError(w, http.StatusConflict, "PLAN_IN_USE", "Cannot delete plan that is being used by users")
        return
    }

    // Delete plan
    if err := db.DB.Delete(&plan).Error; err != nil {
        utils.WriteError(w, http.StatusInternalServerError, "DB_ERROR", "Unable to delete plan")
        return
    }

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(map[string]interface{}{
        "success": true,
        "message": "Plan successfully deleted",
    })
}