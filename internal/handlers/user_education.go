package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"user-api/internal/db"
	"user-api/internal/models"
	"user-api/internal/utils"

	"github.com/go-chi/chi/v5"
)

// AddEducationRequest defines the structure for adding an education record.
type AddEducationRequest struct {
	Title       string  `json:"title" validate:"required"`
	Institution string  `json:"institution" validate:"required"`
	IssueDate   string  `json:"issueDate" validate:"required"`
	DocumentURL *string `json:"documentURL"`
}

// AddEducation godoc
// @Summary      Add an education record to portfolio
// @Description  Allows a psychologist to add an education record to their portfolio
// @Tags         Actions for users
// @Accept       json
// @Produce      json
// @Param        education body AddEducationRequest true "Education data"
// @Success      201 {object} map[string]interface{}
// @Failure      400,401,403,404,500 {object} map[string]interface{}
// @Router       /api/users/portfolio/education [post]
// @Security     BearerAuth
func AddEducation(w http.ResponseWriter, r *http.Request) {
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
		utils.WriteError(w, http.StatusForbidden, "FORBIDDEN", "Only psychologists can manage education")
		return
	}

	var req AddEducationRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "INVALID_FORMAT", "Invalid request format")
		return
	}

	if req.Title == "" || req.Institution == "" || req.IssueDate == "" {
		utils.WriteError(w, http.StatusBadRequest, "MISSING_FIELDS", "Title, institution, and issueDate are required")
		return
	}

	var portfolio models.Portfolio
	if err := db.DB.Where("psychologist_id = ?", user.ID).First(&portfolio).Error; err != nil {
		utils.WriteError(w, http.StatusNotFound, "NOT_FOUND", "Portfolio not found")
		return
	}

	issueDate, err := time.Parse("2006-01-02", req.IssueDate)
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, "INVALID_DATE", "Invalid date format, use YYYY-MM-DD")
		return
	}

	education := models.Education{
		PortfolioID: portfolio.ID,
		Title:       req.Title,
		Institution: req.Institution,
		IssueDate:   issueDate,
		DocumentURL: req.DocumentURL,
	}

	if err := db.DB.Create(&education).Error; err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "DB_ERROR", "Failed to add education")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "Education added successfully",
		"data":    education,
	})
}

// UpdateEducationRequest defines the structure for updating an education record.
type UpdateEducationRequest struct {
	Title       *string `json:"title"`
	Institution *string `json:"institution"`
	IssueDate   *string `json:"issueDate"`
	DocumentURL *string `json:"documentURL"`
}

// UpdateEducation godoc
// @Summary      Update an education record in portfolio
// @Description  Allows a psychologist to update an education record in their portfolio
// @Tags         Actions for users
// @Accept       json
// @Produce      json
// @Param        education_id path int true "Education ID"
// @Param        education body UpdateEducationRequest true "Education data"
// @Success      200 {object} map[string]interface{}
// @Failure      400,401,403,404,500 {object} map[string]interface{}
// @Router       /api/users/portfolio/education/{education_id} [put]
// @Security     BearerAuth
func UpdateEducation(w http.ResponseWriter, r *http.Request) {
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
		utils.WriteError(w, http.StatusForbidden, "FORBIDDEN", "Only psychologists can manage education")
		return
	}

	educationID, err := strconv.ParseUint(chi.URLParam(r, "education_id"), 10, 64)
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, "INVALID_ID", "Invalid education ID")
		return
	}

	var req UpdateEducationRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "INVALID_FORMAT", "Invalid request format")
		return
	}

	var education models.Education
	if err := db.DB.Joins("JOIN portfolios ON educations.portfolio_id = portfolios.id").
		Where("educations.id = ? AND portfolios.psychologist_id = ?", educationID, user.ID).
		First(&education).Error; err != nil {
		utils.WriteError(w, http.StatusNotFound, "NOT_FOUND", "Education not found or access denied")
		return
	}

	if req.Title != nil {
		education.Title = *req.Title
	}
	if req.Institution != nil {
		education.Institution = *req.Institution
	}
	if req.IssueDate != nil {
		issueDate, err := time.Parse("2006-01-02", *req.IssueDate)
		if err != nil {
			utils.WriteError(w, http.StatusBadRequest, "INVALID_DATE", "Invalid date format, use YYYY-MM-DD")
			return
		}
		education.IssueDate = issueDate
	}
	if req.DocumentURL != nil {
		education.DocumentURL = req.DocumentURL
	}

	if err := db.DB.Save(&education).Error; err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "DB_ERROR", "Failed to update education")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "Education updated successfully",
		"data":    education,
	})
}

// DeleteEducation godoc
// @Summary      Delete an education record from portfolio
// @Description  Allows a psychologist to delete an education record from their portfolio
// @Tags         Actions for users
// @Produce      json
// @Param        education_id path int true "Education ID"
// @Success      200 {object} map[string]interface{}
// @Failure      401,403,404,500 {object} map[string]interface{}
// @Router       /api/users/portfolio/education/{education_id} [delete]
// @Security     BearerAuth
func DeleteEducation(w http.ResponseWriter, r *http.Request) {
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
		utils.WriteError(w, http.StatusForbidden, "FORBIDDEN", "Only psychologists can manage education")
		return
	}

	educationID, err := strconv.ParseUint(chi.URLParam(r, "education_id"), 10, 64)
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, "INVALID_ID", "Invalid education ID")
		return
	}

	var education models.Education
	if err := db.DB.Joins("JOIN portfolios ON educations.portfolio_id = portfolios.id").
		Where("educations.id = ? AND portfolios.psychologist_id = ?", educationID, user.ID).
		First(&education).Error; err != nil {
		utils.WriteError(w, http.StatusNotFound, "NOT_FOUND", "Education not found or access denied")
		return
	}

	if err := db.DB.Delete(&education).Error; err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "DB_ERROR", "Failed to delete education")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "Education deleted successfully",
	})
}
