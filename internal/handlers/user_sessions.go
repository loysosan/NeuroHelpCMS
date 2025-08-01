package handlers

import (
	"net/http"
	"strconv"
	"user-api/internal/db"
	"user-api/internal/models"
	"user-api/internal/utils"

	"github.com/go-chi/chi/v5"
	"github.com/rs/zerolog/log"
)

// BookSession godoc
// @Summary      Book a session
// @Description  Allows a client to book an available slot with a psychologist
// @Tags         Sessions
// @Produce      json
// @Param        slotId path int true "Availability Slot ID"
// @Success      201 {object} map[string]interface{}
// @Failure      400,401,403,404,409,500 {object} map[string]interface{}
// @Router       /api/users/sessions/book/{slotId} [post]
// @Security     BearerAuth
func BookSession(w http.ResponseWriter, r *http.Request) {
	client := r.Context().Value("user").(*models.User)
	if client.Role != "client" {
		utils.WriteError(w, http.StatusForbidden, "ACCESS_DENIED", "Only clients can book sessions")
		return
	}

	slotID, err := strconv.ParseUint(chi.URLParam(r, "slotId"), 10, 64)
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, "INVALID_ID", "Invalid slot ID")
		return
	}

	tx := db.DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	var slot models.Availability
	if err := tx.Set("gorm:query_option", "FOR UPDATE").Where("id = ? AND status = 'available'", slotID).First(&slot).Error; err != nil {
		tx.Rollback()
		utils.WriteError(w, http.StatusNotFound, "SLOT_NOT_FOUND_OR_BOOKED", "This time slot is no longer available")
		return
	}

	slot.Status = "booked"
	if err := tx.Model(&slot).Update("status", "booked").Error; err != nil {
		tx.Rollback()
		utils.WriteError(w, http.StatusInternalServerError, "DB_ERROR", "Failed to update slot status")
		return
	}

	session := models.Session{
		PsychologistID: slot.PsychologistID,
		ClientID:       client.ID,
		StartTime:      slot.StartTime,
		EndTime:        slot.EndTime,
		Status:         "confirmed", // Или 'pending', если нужно подтверждение психолога
	}

	if err := tx.Create(&session).Error; err != nil {
		tx.Rollback()
		utils.WriteError(w, http.StatusInternalServerError, "DB_ERROR", "Failed to create session")
		return
	}

	if err := tx.Commit().Error; err != nil {
		log.Error().Err(err).Msg("Transaction commit failed for booking session")
		utils.WriteError(w, http.StatusInternalServerError, "DB_ERROR", "Failed to finalize booking")
		return
	}

	utils.WriteJSON(w, http.StatusCreated, map[string]interface{}{
		"success": true,
		"message": "Session booked successfully",
		"data":    session,
	})
}

// GetMySessions godoc
// @Summary      Get my sessions
// @Description  Get all sessions for the logged-in user (client or psychologist)
// @Tags         Sessions
// @Produce      json
// @Success      200 {array} models.Session
// @Failure      401,500 {object} map[string]interface{}
// @Router       /api/users/sessions/my [get]
// @Security     BearerAuth
func GetMySessions(w http.ResponseWriter, r *http.Request) {
	user := r.Context().Value("user").(*models.User)
	var sessions []models.Session
	var err error

	if user.Role == "psychologist" {
		err = db.DB.Preload("Client").Where("psychologist_id = ?", user.ID).Order("start_time DESC").Find(&sessions).Error
	} else {
		err = db.DB.Preload("Psychologist").Where("client_id = ?", user.ID).Order("start_time DESC").Find(&sessions).Error
	}

	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "DB_ERROR", "Failed to retrieve sessions")
		return
	}

	utils.WriteJSON(w, http.StatusOK, sessions)
}
