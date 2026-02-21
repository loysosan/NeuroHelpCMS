package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"time"
	"user-api/internal/db"
	"user-api/internal/models"
	"user-api/internal/utils"

	"github.com/go-chi/chi/v5"
	"github.com/rs/zerolog/log"
)

// CreateScheduleTemplate godoc
// @Summary      Create schedule template
// @Description  Allows a psychologist to add a recurring weekly availability template
// @Tags         Schedule
// @Accept       json
// @Produce      json
// @Success      201 {object} map[string]interface{}
// @Failure      400,401,403,500 {object} map[string]interface{}
// @Router       /api/users/schedule-templates [post]
// @Security     BearerAuth
func CreateScheduleTemplate(w http.ResponseWriter, r *http.Request) {
	user, ok := getUserFromCtx(w, r)
	if !ok {
		return
	}
	if user.Role != "psychologist" {
		utils.WriteError(w, http.StatusForbidden, "ACCESS_DENIED", "Only psychologists can manage schedule templates")
		return
	}

	var req struct {
		DayOfWeek           int    `json:"dayOfWeek"`
		StartTime           string `json:"startTime"`
		EndTime             string `json:"endTime"`
		SlotDurationMinutes int    `json:"slotDurationMinutes"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "INVALID_JSON", "Invalid JSON format")
		return
	}

	if req.DayOfWeek < 0 || req.DayOfWeek > 6 {
		utils.WriteError(w, http.StatusBadRequest, "INVALID_DAY", "dayOfWeek must be 0 (Mon) to 6 (Sun)")
		return
	}
	if req.SlotDurationMinutes <= 0 {
		req.SlotDurationMinutes = 60
	}

	template := models.ScheduleTemplate{
		PsychologistID:      user.ID,
		DayOfWeek:           req.DayOfWeek,
		StartTime:           req.StartTime,
		EndTime:             req.EndTime,
		SlotDurationMinutes: req.SlotDurationMinutes,
		IsActive:            true,
	}

	if err := db.DB.Create(&template).Error; err != nil {
		log.Error().Err(err).Msg("Failed to create schedule template")
		utils.WriteError(w, http.StatusInternalServerError, "DB_ERROR", "Failed to create schedule template")
		return
	}

	utils.WriteJSON(w, http.StatusCreated, map[string]interface{}{
		"success": true,
		"data":    template,
	})
}

// GetMyScheduleTemplates godoc
// @Summary      Get my schedule templates
// @Tags         Schedule
// @Produce      json
// @Success      200 {array} models.ScheduleTemplate
// @Router       /api/users/schedule-templates [get]
// @Security     BearerAuth
func GetMyScheduleTemplates(w http.ResponseWriter, r *http.Request) {
	user, ok := getUserFromCtx(w, r)
	if !ok {
		return
	}
	if user.Role != "psychologist" {
		utils.WriteError(w, http.StatusForbidden, "ACCESS_DENIED", "Only psychologists can view schedule templates")
		return
	}

	var templates []models.ScheduleTemplate
	if err := db.DB.Where("psychologist_id = ?", user.ID).Order("day_of_week, start_time").Find(&templates).Error; err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "DB_ERROR", "Failed to get schedule templates")
		return
	}

	utils.WriteJSON(w, http.StatusOK, templates)
}

// UpdateScheduleTemplate godoc
// @Summary      Update schedule template
// @Tags         Schedule
// @Accept       json
// @Produce      json
// @Param        id path int true "Template ID"
// @Success      200 {object} map[string]interface{}
// @Router       /api/users/schedule-templates/{id} [put]
// @Security     BearerAuth
func UpdateScheduleTemplate(w http.ResponseWriter, r *http.Request) {
	user, ok := getUserFromCtx(w, r)
	if !ok {
		return
	}
	templateID, err := strconv.ParseUint(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, "INVALID_ID", "Invalid template ID")
		return
	}

	var template models.ScheduleTemplate
	if err := db.DB.Where("id = ? AND psychologist_id = ?", templateID, user.ID).First(&template).Error; err != nil {
		utils.WriteError(w, http.StatusNotFound, "NOT_FOUND", "Template not found")
		return
	}

	var req struct {
		StartTime           *string `json:"startTime"`
		EndTime             *string `json:"endTime"`
		SlotDurationMinutes *int    `json:"slotDurationMinutes"`
		IsActive            *bool   `json:"isActive"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "INVALID_JSON", "Invalid JSON format")
		return
	}

	if req.StartTime != nil {
		template.StartTime = *req.StartTime
	}
	if req.EndTime != nil {
		template.EndTime = *req.EndTime
	}
	if req.SlotDurationMinutes != nil {
		template.SlotDurationMinutes = *req.SlotDurationMinutes
	}
	if req.IsActive != nil {
		template.IsActive = *req.IsActive
	}

	if err := db.DB.Save(&template).Error; err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "DB_ERROR", "Failed to update template")
		return
	}

	utils.WriteJSON(w, http.StatusOK, map[string]interface{}{"success": true, "data": template})
}

// DeleteScheduleTemplate godoc
// @Summary      Delete schedule template
// @Tags         Schedule
// @Produce      json
// @Param        id path int true "Template ID"
// @Success      200 {object} map[string]interface{}
// @Router       /api/users/schedule-templates/{id} [delete]
// @Security     BearerAuth
func DeleteScheduleTemplate(w http.ResponseWriter, r *http.Request) {
	user, ok := getUserFromCtx(w, r)
	if !ok {
		return
	}
	templateID, err := strconv.ParseUint(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, "INVALID_ID", "Invalid template ID")
		return
	}

	result := db.DB.Where("id = ? AND psychologist_id = ?", templateID, user.ID).Delete(&models.ScheduleTemplate{})
	if result.Error != nil {
		utils.WriteError(w, http.StatusInternalServerError, "DB_ERROR", "Failed to delete template")
		return
	}
	if result.RowsAffected == 0 {
		utils.WriteError(w, http.StatusNotFound, "NOT_FOUND", "Template not found")
		return
	}

	utils.WriteJSON(w, http.StatusOK, map[string]interface{}{"success": true})
}

// GenerateSlotsFromTemplates godoc
// @Summary      Generate availability slots from templates
// @Description  Generates availability slots for a date range based on active weekly templates
// @Tags         Schedule
// @Accept       json
// @Produce      json
// @Success      201 {object} map[string]interface{}
// @Router       /api/users/schedule-templates/generate [post]
// @Security     BearerAuth
func GenerateSlotsFromTemplates(w http.ResponseWriter, r *http.Request) {
	user, ok := getUserFromCtx(w, r)
	if !ok {
		return
	}
	if user.Role != "psychologist" {
		utils.WriteError(w, http.StatusForbidden, "ACCESS_DENIED", "Only psychologists can generate slots")
		return
	}

	var req struct {
		StartDate string `json:"startDate"` // "2025-03-01"
		EndDate   string `json:"endDate"`   // "2025-03-31"
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "INVALID_JSON", "Invalid JSON format")
		return
	}

	startDate, err := time.Parse("2006-01-02", req.StartDate)
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, "INVALID_DATE", "startDate must be YYYY-MM-DD")
		return
	}
	endDate, err := time.Parse("2006-01-02", req.EndDate)
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, "INVALID_DATE", "endDate must be YYYY-MM-DD")
		return
	}
	if endDate.Before(startDate) {
		utils.WriteError(w, http.StatusBadRequest, "INVALID_RANGE", "endDate must be after startDate")
		return
	}
	// Обмеження: не більше 90 днів за раз
	if endDate.Sub(startDate).Hours() > 90*24 {
		utils.WriteError(w, http.StatusBadRequest, "RANGE_TOO_LARGE", "Date range cannot exceed 90 days")
		return
	}

	var templates []models.ScheduleTemplate
	if err := db.DB.Where("psychologist_id = ? AND is_active = true", user.ID).Find(&templates).Error; err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "DB_ERROR", "Failed to load templates")
		return
	}
	if len(templates) == 0 {
		utils.WriteJSON(w, http.StatusOK, map[string]interface{}{
			"success":   true,
			"generated": 0,
			"message":   "No active templates found",
		})
		return
	}

	// dayOfWeek: 0=Пн..6=Нд → відповідає time.Weekday: Mon=1..Sun=0
	// Маппінг: наш 0=Пн → time.Monday(1), наш 6=Нд → time.Sunday(0)
	toTimeWeekday := func(d int) time.Weekday {
		if d == 6 {
			return time.Sunday
		}
		return time.Weekday(d + 1)
	}

	var generated int
	for d := startDate; !d.After(endDate); d = d.AddDate(0, 0, 1) {
		for _, tmpl := range templates {
			if toTimeWeekday(tmpl.DayOfWeek) != d.Weekday() {
				continue
			}

			// Парсимо час шаблону
			slotStart, err := time.Parse("15:04:05", tmpl.StartTime)
			if err != nil {
				slotStart, err = time.Parse("15:04", tmpl.StartTime)
				if err != nil {
					log.Warn().Str("time", tmpl.StartTime).Msg("Cannot parse template start_time")
					continue
				}
			}
			slotEnd, err := time.Parse("15:04:05", tmpl.EndTime)
			if err != nil {
				slotEnd, err = time.Parse("15:04", tmpl.EndTime)
				if err != nil {
					log.Warn().Str("time", tmpl.EndTime).Msg("Cannot parse template end_time")
					continue
				}
			}

			duration := time.Duration(tmpl.SlotDurationMinutes) * time.Minute
			current := time.Date(d.Year(), d.Month(), d.Day(),
				slotStart.Hour(), slotStart.Minute(), 0, 0, time.Local)
			dayEnd := time.Date(d.Year(), d.Month(), d.Day(),
				slotEnd.Hour(), slotEnd.Minute(), 0, 0, time.Local)

			for current.Add(duration).Before(dayEnd) || current.Add(duration).Equal(dayEnd) {
				slotEndTime := current.Add(duration)

				// Перевіряємо чи слот вже існує
				var count int64
				db.DB.Model(&models.Availability{}).
					Where("psychologist_id = ? AND start_time = ?", user.ID, current).
					Count(&count)
				if count == 0 {
					slot := models.Availability{
						PsychologistID: user.ID,
						StartTime:      current,
						EndTime:        slotEndTime,
						Status:         "available",
					}
					if err := db.DB.Create(&slot).Error; err != nil {
						log.Error().Err(err).Msg("Failed to create generated slot")
					} else {
						generated++
					}
				}

				current = current.Add(duration)
			}
		}
	}

	utils.WriteJSON(w, http.StatusCreated, map[string]interface{}{
		"success":   true,
		"generated": generated,
		"message":   fmt.Sprintf("Generated %d availability slots", generated),
	})
}
