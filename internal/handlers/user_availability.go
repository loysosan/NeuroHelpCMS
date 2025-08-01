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
	"github.com/rs/zerolog/log"
)

// CreateAvailabilitySlot godoc
// @Summary      Create an availability slot
// @Description  Allows a psychologist to add a new availability slot to their schedule
// @Tags         Availability
// @Accept       json
// @Produce      json
// @Param        slot body models.Availability true "Availability Slot"
// @Success      201 {object} map[string]interface{}
// @Failure      400,401,403,500 {object} map[string]interface{}
// @Router       /api/users/availability [post]
// @Security     BearerAuth
func CreateAvailabilitySlot(w http.ResponseWriter, r *http.Request) {
	user := r.Context().Value("user").(*models.User)

	if user.Role != "psychologist" {
		utils.WriteError(w, http.StatusForbidden, "ACCESS_DENIED", "Only psychologists can create availability slots")
		return
	}

	var req struct {
		StartTime string `json:"startTime"`
		EndTime   string `json:"endTime"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "INVALID_JSON", "Invalid JSON format")
		return
	}

	startTime, err := time.Parse(time.RFC3339, req.StartTime)
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, "INVALID_TIME", "Invalid start time format, use RFC3339")
		return
	}

	endTime, err := time.Parse(time.RFC3339, req.EndTime)
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, "INVALID_TIME", "Invalid end time format, use RFC3339")
		return
	}

	if endTime.Before(startTime) || endTime.Equal(startTime) {
		utils.WriteError(w, http.StatusBadRequest, "INVALID_TIME_RANGE", "End time must be after start time")
		return
	}

	availability := models.Availability{
		PsychologistID: user.ID,
		StartTime:      startTime,
		EndTime:        endTime,
		Status:         "available",
	}

	if err := db.DB.Create(&availability).Error; err != nil {
		log.Error().Err(err).Msg("Failed to create availability slot")
		utils.WriteError(w, http.StatusInternalServerError, "DB_ERROR", "Failed to create availability slot")
		return
	}

	utils.WriteJSON(w, http.StatusCreated, map[string]interface{}{
		"success": true,
		"data":    availability,
	})
}

// GetPsychologistAvailability godoc
// @Summary      Get psychologist's availability
// @Description  Get all available slots for a specific psychologist
// @Tags         Availability
// @Produce      json
// @Param        psychologistId path int true "Psychologist ID"
// @Success      200 {array} models.Availability
// @Failure      400,500 {object} map[string]interface{}
// @Router       /api/users/availability/{psychologistId} [get]
func GetPsychologistAvailability(w http.ResponseWriter, r *http.Request) {
	psychologistIDStr := chi.URLParam(r, "psychologistId")
	psychologistID, err := strconv.ParseUint(psychologistIDStr, 10, 64)
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, "INVALID_ID", "Invalid psychologist ID")
		return
	}

	var availability []models.Availability
	// ИЗМЕНЕНО: Добавлена фильтрация по статусу 'available' и времени начала
	if err := db.DB.Where("psychologist_id = ? AND status = ? AND start_time > ?", psychologistID, "available", time.Now()).Find(&availability).Error; err != nil {
		log.Error().Err(err).Msg("Failed to get availability from db")
		utils.WriteError(w, http.StatusInternalServerError, "DB_ERROR", "Failed to get availability")
		return
	}

	utils.WriteJSON(w, http.StatusOK, availability)
}

// DeleteAvailabilitySlot godoc
// @Summary      Delete an availability slot
// @Description  Allows a psychologist to delete an unbooked availability slot
// @Tags         Availability
// @Produce      json
// @Param        slotId path int true "Slot ID"
// @Success      200 {object} map[string]interface{}
// @Failure      401,403,404,500 {object} map[string]interface{}
// @Router       /api/users/availability/{slotId} [delete]
// @Security     BearerAuth
func DeleteAvailabilitySlot(w http.ResponseWriter, r *http.Request) {
	user := r.Context().Value("user").(*models.User)
	slotID, err := strconv.ParseUint(chi.URLParam(r, "slotId"), 10, 64)
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, "INVALID_ID", "Invalid slot ID")
		return
	}

	var slot models.Availability
	if err := db.DB.Where("id = ? AND psychologist_id = ?", slotID, user.ID).First(&slot).Error; err != nil {
		utils.WriteError(w, http.StatusNotFound, "SLOT_NOT_FOUND", "Availability slot not found or you don't have permission")
		return
	}

	if slot.Status == "booked" {
		utils.WriteError(w, http.StatusConflict, "SLOT_BOOKED", "Cannot delete a booked slot. Please cancel the session instead.")
		return
	}

	if err := db.DB.Delete(&slot).Error; err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "DB_ERROR", "Failed to delete availability slot")
		return
	}

	utils.WriteJSON(w, http.StatusOK, map[string]interface{}{"success": true, "message": "Slot deleted"})
}
