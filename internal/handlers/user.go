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

func CreateUser(w http.ResponseWriter, r *http.Request) {
	var user models.User
	if err := json.NewDecoder(r.Body).Decode(&user); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "INVALID_JSON", "Incorrect request format")
		return
	}

	// Role Validation
	if user.Role != "client" && user.Role != "psychologist" {
		utils.WriteError(w, http.StatusBadRequest, "INVALID_ROLE", "Role must be 'client' or 'psychologist'")
		return
	}

	// Check existing email
	var existing models.User
	if err := db.DB.Where("email = ?", user.Email).First(&existing).Error; err == nil {
		utils.WriteError(w, http.StatusConflict, "USER_ALREADY_EXISTS", "User with this email already exists")
		return
	}

	// User creating
	if err := db.DB.Create(&user).Error; err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "DB_ERROR", "Unable to create user")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    user,
	})
}

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

func GetAllUsers(w http.ResponseWriter, r *http.Request) {
	var users []models.User
	db.DB.Find(&users)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(users)
}

