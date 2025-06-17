package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"
	"user-api/internal/db"
	"user-api/internal/models"
    "user-api/internal/utils"

	"github.com/go-chi/chi/v5"
	"github.com/rs/zerolog/log"
	"golang.org/x/crypto/bcrypt"
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

// DeleteSkill godoc
// @Summary      Delete skill
// @Description  Delete skill by ID (admin only)
// @Tags         Actions for administrators
// @Produce      json
// @Param        id path int true "Skill ID"
// @Success      200 {object} map[string]interface{}
// @Failure      404 {object} map[string]interface{}
// @Failure      500 {object} map[string]interface{}
// @Router       /api/admin/skills/{id} [delete]
// @Security     BearerAuth
func DeleteSkill(w http.ResponseWriter, r *http.Request) {
    id := chi.URLParam(r, "id")
    skillID, err := strconv.Atoi(id)
    if err != nil {
        utils.WriteError(w, http.StatusBadRequest, "INVALID_ID", "Invalid skill ID format")
        return
    }

    // Перевіряємо чи існує навичка
    var skill models.Skill
    if err := db.DB.First(&skill, skillID).Error; err != nil {
        utils.WriteError(w, http.StatusNotFound, "SKILL_NOT_FOUND", "Skill not found")
        return
    }

    // Видаляємо навичку
    if err := db.DB.Delete(&skill).Error; err != nil {
        utils.WriteError(w, http.StatusInternalServerError, "DB_ERROR", "Unable to delete skill")
        return
    }

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(map[string]interface{}{
        "success": true,
        "message": "Skill successfully deleted",
    })
}

// DeleteSkillCategory godoc
// @Summary      Delete skill category
// @Description  Delete skill category by ID (admin only)
// @Tags         Actions for administrators
// @Produce      json
// @Param        id path int true "Category ID"
// @Success      200 {object} map[string]interface{}
// @Failure      404 {object} map[string]interface{}
// @Failure      500 {object} map[string]interface{}
// @Router       /api/admin/skills/categories/{id} [delete]
// @Security     BearerAuth
func DeleteSkillCategory(w http.ResponseWriter, r *http.Request) {
    id := chi.URLParam(r, "id")
    categoryID, err := strconv.Atoi(id)
    if err != nil {
        utils.WriteError(w, http.StatusBadRequest, "INVALID_ID", "Invalid category ID format")
        return
    }

    // Перевіряємо чи існує категорія
    var category models.Category
    if err := db.DB.First(&category, categoryID).Error; err != nil {
        utils.WriteError(w, http.StatusNotFound, "CATEGORY_NOT_FOUND", "Category not found")
        return
    }

    // Оновлюємо всі навички цієї категорії на null
    if err := db.DB.Model(&models.Skill{}).Where("category_id = ?", categoryID).Update("category_id", nil).Error; err != nil {
        utils.WriteError(w, http.StatusInternalServerError, "DB_ERROR", "Unable to update skills")
        return
    }

    // Видаляємо категорію
    if err := db.DB.Delete(&category).Error; err != nil {
        utils.WriteError(w, http.StatusInternalServerError, "DB_ERROR", "Unable to delete category")
        return
    }

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(map[string]interface{}{
        "success": true,
        "message": "Category successfully deleted",
    })
}

// UpdateSkill godoc
// @Summary      Update skill
// @Description  Update skill by ID (admin only)
// @Tags         Actions for administrators
// @Accept       json
// @Produce      json
// @Param        id path int true "Skill ID"
// @Param        skill body models.Skill true "Updated skill data"
// @Success      200 {object} map[string]interface{}
// @Failure      404,500 {object} map[string]interface{}
// @Router       /api/admin/skills/{id} [put]
// @Security     BearerAuth
func UpdateSkill(w http.ResponseWriter, r *http.Request) {
    id := chi.URLParam(r, "id")
    skillID, err := strconv.Atoi(id)
    if err != nil {
        utils.WriteError(w, http.StatusBadRequest, "INVALID_ID", "Invalid skill ID format")
        return
    }

    // Перевіряємо чи існує навичка
    var skill models.Skill
    if err := db.DB.First(&skill, skillID).Error; err != nil {
        utils.WriteError(w, http.StatusNotFound, "SKILL_NOT_FOUND", "Skill not found")
        return
    }

    // Декодуємо нові дані
    var updatedSkill models.Skill
    if err := json.NewDecoder(r.Body).Decode(&updatedSkill); err != nil {
        utils.WriteError(w, http.StatusBadRequest, "INVALID_DATA", "Invalid request data")
        return
    }

    // Оновлюємо дані
    skill.Name = updatedSkill.Name
    skill.CategoryID = updatedSkill.CategoryID

    if err := db.DB.Save(&skill).Error; err != nil {
        utils.WriteError(w, http.StatusInternalServerError, "DB_ERROR", "Unable to update skill")
        return
    }

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(map[string]interface{}{
        "success": true,
        "data": skill,
    })
}

// UpdateSkillCategory godoc
// @Summary      Update skill category
// @Description  Update skill category by ID (admin only)
// @Tags         Actions for administrators
// @Accept       json
// @Produce      json
// @Param        id path int true "Category ID"
// @Param        category body models.Category true "Updated category data"
// @Success      200 {object} map[string]interface{}
// @Failure      404,500 {object} map[string]interface{}
// @Router       /api/admin/skills/categories/{id} [put]
// @Security     BearerAuth
func UpdateSkillCategory(w http.ResponseWriter, r *http.Request) {
    id := chi.URLParam(r, "id")
    categoryID, err := strconv.Atoi(id)
    if err != nil {
        utils.WriteError(w, http.StatusBadRequest, "INVALID_ID", "Invalid category ID format")
        return
    }

    // Перевіряємо чи існує категорія
    var category models.Category
    if err := db.DB.First(&category, categoryID).Error; err != nil {
        utils.WriteError(w, http.StatusNotFound, "CATEGORY_NOT_FOUND", "Category not found")
        return
    }

    // Декодуємо нові дані
    var updatedCategory models.Category
    if err := json.NewDecoder(r.Body).Decode(&updatedCategory); err != nil {
        utils.WriteError(w, http.StatusBadRequest, "INVALID_DATA", "Invalid request data")
        return
    }

    // Оновлюємо назву
    category.Name = updatedCategory.Name

    if err := db.DB.Save(&category).Error; err != nil {
        utils.WriteError(w, http.StatusInternalServerError, "DB_ERROR", "Unable to update category")
        return
    }

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(map[string]interface{}{
        "success": true,
        "data": category,
    })
}

// CreateAdmin creates a new administrator (requires admin or master role)
// @Summary      Create administrator
// @Description  Add a new administrator (admin or master role only)
// @Tags         Actions for administrators
// @Accept       json
// @Produce      json
// @Param        admin body models.Administrator true "Administrator data"
// @Success      201 {object} map[string]interface{}
// @Failure      400,403,409,500 {object} map[string]interface{}
// @Router       /api/admin/administrators [post]
// @Security     BearerAuth
func CreateAdmin(w http.ResponseWriter, r *http.Request) {
    // Get current admin from context
    currentAdmin := r.Context().Value("admin").(*models.Administrator)

    // Check permissions
    if currentAdmin.Role == "moderator" {
        utils.WriteError(w, http.StatusForbidden, "FORBIDDEN", "Moderators cannot create administrators")
        return
    }

    var newAdmin models.Administrator
    if err := json.NewDecoder(r.Body).Decode(&newAdmin); err != nil {
        utils.WriteError(w, http.StatusBadRequest, "INVALID_INPUT", "Invalid request body")
        return
    }

    // Prevent creation of master role
    if newAdmin.Role == "master" {
        utils.WriteError(w, http.StatusForbidden, "FORBIDDEN", "Cannot create master role")
        return
    }

    // Hash password
    hashedPassword, err := bcrypt.GenerateFromPassword([]byte(newAdmin.Password), bcrypt.DefaultCost)
    if err != nil {
        utils.WriteError(w, http.StatusInternalServerError, "PASSWORD_HASH_ERROR", "Failed to hash password")
        return
    }
    newAdmin.Password = string(hashedPassword)

    if err := db.DB.Create(&newAdmin).Error; err != nil {
        utils.WriteError(w, http.StatusInternalServerError, "DB_ERROR", "Failed to create administrator")
        return
    }

    newAdmin.Password = "" // Don't return password in response
    json.NewEncoder(w).Encode(newAdmin)
}

// UpdateAdmin updates administrator details
// @Summary      Update administrator
// @Description  Update administrator details by ID (admin or master role only)
// @Tags         Actions for administrators
// @Accept       json
// @Produce      json
// @Param        id path int true "Administrator ID"
// @Param        admin body models.Administrator true "Updated administrator data"
// @Success      200 {object} map[string]interface{}
// @Failure      400,403,404,500 {object} map[string]interface{}
// @Router       /api/admin/administrators/{id} [put]
// @Security     BearerAuth
func UpdateAdmin(w http.ResponseWriter, r *http.Request) {
    currentAdmin := r.Context().Value("admin").(*models.Administrator)
    adminID := chi.URLParam(r, "id")

    // Get admin to update
    var admin models.Administrator
    if err := db.DB.First(&admin, adminID).Error; err != nil {
        utils.WriteError(w, http.StatusNotFound, "NOT_FOUND", "Administrator not found")
        return
    }

    // Check permissions
    if currentAdmin.Role == "moderator" || 
       (currentAdmin.Role == "admin" && admin.Role == "master") {
        utils.WriteError(w, http.StatusForbidden, "FORBIDDEN", "Insufficient permissions")
        return
    }

    var updates struct {
        FirstName string `json:"firstName"`
        LastName  string `json:"lastName"`
        Email     string `json:"email"`
        Phone     string `json:"phone"`
        Status    string `json:"status"`
        Role      string `json:"role"`
    }

    if err := json.NewDecoder(r.Body).Decode(&updates); err != nil {
        utils.WriteError(w, http.StatusBadRequest, "INVALID_INPUT", "Invalid request body")
        return
    }

    // Prevent changing master role
    if admin.Role == "master" {
        utils.WriteError(w, http.StatusForbidden, "FORBIDDEN", "Cannot modify master account")
        return
    }

    // Update fields
    admin.FirstName = updates.FirstName
    admin.LastName = updates.LastName
    admin.Email = updates.Email
    admin.Phone = &updates.Phone
    admin.Status = updates.Status
    
    // Only master can change roles
    if currentAdmin.Role == "master" {
        admin.Role = updates.Role
    }

    if err := db.DB.Save(&admin).Error; err != nil {
        utils.WriteError(w, http.StatusInternalServerError, "DB_ERROR", "Failed to update administrator")
        return
    }

    admin.Password = "" // Don't return password
    json.NewEncoder(w).Encode(admin)
}

// DeleteAdmin deletes an administrator
// @Summary      Delete administrator
// @Description  Delete administrator by ID (admin or master role only)
// @Tags         Actions for administrators
// @Produce      json
// @Param        id path int true "Administrator ID"
// @Success      204 {object} map[string]interface{}
// @Failure      404,403,500 {object} map[string]interface{}
// @Router       /api/admin/administrators/{id} [delete]
// @Security     BearerAuth
func DeleteAdmin(w http.ResponseWriter, r *http.Request) {
    currentAdmin := r.Context().Value("admin").(*models.Administrator)
    adminID := chi.URLParam(r, "id")

    var admin models.Administrator
    if err := db.DB.First(&admin, adminID).Error; err != nil {
        utils.WriteError(w, http.StatusNotFound, "NOT_FOUND", "Administrator not found")
        return
    }

    // Prevent deleting master account
    if admin.Role == "master" {
        utils.WriteError(w, http.StatusForbidden, "FORBIDDEN", "Cannot delete master account")
        return
    }

    // Check permissions
    if currentAdmin.Role == "moderator" || 
       (currentAdmin.Role == "admin" && admin.Role == "admin") {
        utils.WriteError(w, http.StatusForbidden, "FORBIDDEN", "Insufficient permissions")
        return
    }

    if err := db.DB.Delete(&admin).Error; err != nil {
        utils.WriteError(w, http.StatusInternalServerError, "DB_ERROR", "Failed to delete administrator")
        return
    }

    w.WriteHeader(http.StatusNoContent)
}

// GetAdministrators godoc
// @Summary      Get all administrators
// @Description  Retrieve all administrators (admin or master role only)
// @Tags         Actions for administrators
// @Produce      json
// @Success      200 {array} models.Administrator
// @Failure      403,500 {object} map[string]interface{}
// @Router       /api/admin/administrators [get]
// @Security     BearerAuth
func GetAdministrators(w http.ResponseWriter, r *http.Request) {
    // Get current admin from context
    currentAdmin := r.Context().Value("admin").(*models.Administrator)

    // Check permissions
    if currentAdmin.Role == "moderator" {
        utils.WriteError(w, http.StatusForbidden, "FORBIDDEN", "Moderators cannot view administrators list")
        return
    }

    var administrators []models.Administrator
    if err := db.DB.Find(&administrators).Error; err != nil {
        utils.WriteError(w, http.StatusInternalServerError, "DB_ERROR", "Failed to retrieve administrators")
        return
    }

    // Remove sensitive data
    for i := range administrators {
        administrators[i].Password = ""
    }

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(administrators)
}