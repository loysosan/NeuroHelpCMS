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

// getUserFromCtx читає email з контексту і повертає User з БД.
// Правильний паттерн цього проєкту: middleware кладе тільки рядки (email, username, role).
func getUserFromCtx(w http.ResponseWriter, r *http.Request) (*models.User, bool) {
	email, ok := r.Context().Value("email").(string)
	if !ok || email == "" {
		utils.WriteError(w, http.StatusUnauthorized, "UNAUTHORIZED", "Unauthorized")
		return nil, false
	}
	var user models.User
	if err := db.DB.Where("email = ?", email).First(&user).Error; err != nil {
		utils.WriteError(w, http.StatusUnauthorized, "UNAUTHORIZED", "User not found")
		return nil, false
	}
	return &user, true
}

// sessionPersonDTO — вкладений об'єкт особи у відповіді сесії
type sessionPersonDTO struct {
	ID        uint64 `json:"id"`
	FirstName string `json:"firstName"`
	LastName  string `json:"lastName"`
}

// sessionDTO — легка структура для відповіді (без рекурсивних зв'язків User)
type sessionDTO struct {
	ID             uint64            `json:"id"`
	PsychologistID uint64            `json:"psychologistId"`
	ClientID       *uint64           `json:"clientId"`
	AvailabilityID *uint64           `json:"availabilityId"`
	StartTime      string            `json:"startTime"`
	EndTime        string            `json:"endTime"`
	Status         string            `json:"status"`
	ClientNotes    *string           `json:"clientNotes"`
	CreatedAt      string            `json:"createdAt"`
	Psychologist   *sessionPersonDTO `json:"psychologist,omitempty"`
	Client         *sessionPersonDTO `json:"client,omitempty"`
}

func toSessionDTO(s models.Session) sessionDTO {
	dto := sessionDTO{
		ID:             s.ID,
		PsychologistID: s.PsychologistID,
		ClientID:       s.ClientID,
		AvailabilityID: s.AvailabilityID,
		StartTime:      s.StartTime.Format(time.RFC3339),
		EndTime:        s.EndTime.Format(time.RFC3339),
		Status:         s.Status,
		ClientNotes:    s.ClientNotes,
		CreatedAt:      s.CreatedAt.Format(time.RFC3339),
	}
	if s.Psychologist.ID != 0 {
		dto.Psychologist = &sessionPersonDTO{
			ID:        s.Psychologist.ID,
			FirstName: s.Psychologist.FirstName,
			LastName:  s.Psychologist.LastName,
		}
	}
	if s.Client.ID != 0 {
		dto.Client = &sessionPersonDTO{
			ID:        s.Client.ID,
			FirstName: s.Client.FirstName,
			LastName:  s.Client.LastName,
		}
	}
	return dto
}

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
	client, ok := getUserFromCtx(w, r)
	if !ok {
		return
	}
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

	if err := tx.Model(&slot).Update("status", "booked").Error; err != nil {
		tx.Rollback()
		utils.WriteError(w, http.StatusInternalServerError, "DB_ERROR", "Failed to update slot status")
		return
	}

	session := models.Session{
		PsychologistID: slot.PsychologistID,
		ClientID:       &client.ID,
		AvailabilityID: &slot.ID,
		StartTime:      slot.StartTime,
		EndTime:        slot.EndTime,
		Status:         "confirmed",
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
		"data":    toSessionDTO(session),
	})
}

// RequestFreeTimeSession godoc
// @Summary      Request a free-time session
// @Description  Allows a client to request a session at any time (schedule_enforced=false)
// @Tags         Sessions
// @Accept       json
// @Produce      json
// @Success      201 {object} map[string]interface{}
// @Router       /api/users/sessions/request [post]
// @Security     BearerAuth
func RequestFreeTimeSession(w http.ResponseWriter, r *http.Request) {
	client, ok := getUserFromCtx(w, r)
	if !ok {
		return
	}
	if client.Role != "client" {
		utils.WriteError(w, http.StatusForbidden, "ACCESS_DENIED", "Only clients can request sessions")
		return
	}

	var req struct {
		PsychologistID uint64 `json:"psychologistId"`
		StartTime      string `json:"startTime"`
		EndTime        string `json:"endTime"`
		ClientNotes    string `json:"clientNotes"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "INVALID_JSON", "Invalid JSON format")
		return
	}

	startTime, err := time.Parse(time.RFC3339, req.StartTime)
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, "INVALID_TIME", "startTime must be RFC3339")
		return
	}
	endTime, err := time.Parse(time.RFC3339, req.EndTime)
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, "INVALID_TIME", "endTime must be RFC3339")
		return
	}
	if !endTime.After(startTime) {
		utils.WriteError(w, http.StatusBadRequest, "INVALID_RANGE", "endTime must be after startTime")
		return
	}

	var portfolio models.Portfolio
	if err := db.DB.Where("psychologist_id = ?", req.PsychologistID).First(&portfolio).Error; err != nil {
		utils.WriteError(w, http.StatusNotFound, "PSYCHOLOGIST_NOT_FOUND", "Psychologist not found")
		return
	}
	if portfolio.ScheduleEnforced {
		utils.WriteError(w, http.StatusConflict, "SCHEDULE_ENFORCED", "This psychologist requires booking through available slots only")
		return
	}

	notes := req.ClientNotes
	session := models.Session{
		PsychologistID: req.PsychologistID,
		ClientID:       &client.ID,
		StartTime:      startTime,
		EndTime:        endTime,
		Status:         "pending",
		ClientNotes:    &notes,
	}

	if err := db.DB.Create(&session).Error; err != nil {
		log.Error().Err(err).Msg("Failed to create free-time session request")
		utils.WriteError(w, http.StatusInternalServerError, "DB_ERROR", "Failed to create session request")
		return
	}

	utils.WriteJSON(w, http.StatusCreated, map[string]interface{}{
		"success": true,
		"message": "Session request sent. Waiting for psychologist confirmation.",
		"data":    toSessionDTO(session),
	})
}

// GetMySessions godoc
// @Summary      Get my sessions
// @Description  Get all sessions for the logged-in user (client or psychologist)
// @Tags         Sessions
// @Produce      json
// @Success      200 {array} sessionDTO
// @Failure      401,500 {object} map[string]interface{}
// @Router       /api/users/sessions/my [get]
// @Security     BearerAuth
func GetMySessions(w http.ResponseWriter, r *http.Request) {
	user, ok := getUserFromCtx(w, r)
	if !ok {
		return
	}

	var sessions []models.Session
	var dbErr error

	if user.Role == "psychologist" {
		dbErr = db.DB.Preload("Client").
			Where("psychologist_id = ?", user.ID).
			Order("start_time DESC").
			Find(&sessions).Error
	} else {
		dbErr = db.DB.Preload("Psychologist").
			Where("client_id = ?", user.ID).
			Order("start_time DESC").
			Find(&sessions).Error
	}

	if dbErr != nil {
		utils.WriteError(w, http.StatusInternalServerError, "DB_ERROR", "Failed to retrieve sessions")
		return
	}

	dtos := make([]sessionDTO, len(sessions))
	for i, s := range sessions {
		dtos[i] = toSessionDTO(s)
	}

	utils.WriteJSON(w, http.StatusOK, dtos)
}

// CancelSession godoc
// @Summary      Cancel a session
// @Description  Allows client or psychologist to cancel a session
// @Tags         Sessions
// @Produce      json
// @Param        id path int true "Session ID"
// @Success      200 {object} map[string]interface{}
// @Router       /api/users/sessions/{id}/cancel [put]
// @Security     BearerAuth
func CancelSession(w http.ResponseWriter, r *http.Request) {
	user, ok := getUserFromCtx(w, r)
	if !ok {
		return
	}

	sessionID, err := strconv.ParseUint(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, "INVALID_ID", "Invalid session ID")
		return
	}

	var session models.Session
	if err := db.DB.First(&session, sessionID).Error; err != nil {
		utils.WriteError(w, http.StatusNotFound, "NOT_FOUND", "Session not found")
		return
	}

	clientMatch := session.ClientID != nil && *session.ClientID == user.ID
	psychologistMatch := session.PsychologistID == user.ID
	if !clientMatch && !psychologistMatch {
		utils.WriteError(w, http.StatusForbidden, "ACCESS_DENIED", "You don't have access to this session")
		return
	}

	if session.Status == "canceled" || session.Status == "completed" {
		utils.WriteError(w, http.StatusConflict, "INVALID_STATUS", "Session is already "+session.Status)
		return
	}

	tx := db.DB.Begin()
	if err := tx.Model(&session).Update("status", "canceled").Error; err != nil {
		tx.Rollback()
		utils.WriteError(w, http.StatusInternalServerError, "DB_ERROR", "Failed to cancel session")
		return
	}

	if session.AvailabilityID != nil {
		tx.Model(&models.Availability{}).
			Where("id = ?", *session.AvailabilityID).
			Update("status", "available")
	}

	if err := tx.Commit().Error; err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "DB_ERROR", "Failed to finalize cancellation")
		return
	}

	utils.WriteJSON(w, http.StatusOK, map[string]interface{}{"success": true, "message": "Session canceled"})
}

// ConfirmSession godoc
// @Summary      Confirm a pending session
// @Description  Allows a psychologist to confirm a pending free-time session request
// @Tags         Sessions
// @Produce      json
// @Param        id path int true "Session ID"
// @Success      200 {object} map[string]interface{}
// @Router       /api/users/sessions/{id}/confirm [put]
// @Security     BearerAuth
func ConfirmSession(w http.ResponseWriter, r *http.Request) {
	user, ok := getUserFromCtx(w, r)
	if !ok {
		return
	}
	if user.Role != "psychologist" {
		utils.WriteError(w, http.StatusForbidden, "ACCESS_DENIED", "Only psychologists can confirm sessions")
		return
	}

	sessionID, err := strconv.ParseUint(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, "INVALID_ID", "Invalid session ID")
		return
	}

	var session models.Session
	if err := db.DB.Where("id = ? AND psychologist_id = ?", sessionID, user.ID).First(&session).Error; err != nil {
		utils.WriteError(w, http.StatusNotFound, "NOT_FOUND", "Session not found")
		return
	}

	if session.Status != "pending" {
		utils.WriteError(w, http.StatusConflict, "INVALID_STATUS", "Only pending sessions can be confirmed")
		return
	}

	if err := db.DB.Model(&session).Update("status", "confirmed").Error; err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "DB_ERROR", "Failed to confirm session")
		return
	}

	utils.WriteJSON(w, http.StatusOK, map[string]interface{}{"success": true, "message": "Session confirmed"})
}

// CompleteSession godoc
// @Summary      Mark session as completed
// @Description  Allows a psychologist to mark a session as completed
// @Tags         Sessions
// @Produce      json
// @Param        id path int true "Session ID"
// @Success      200 {object} map[string]interface{}
// @Router       /api/users/sessions/{id}/complete [put]
// @Security     BearerAuth
func CompleteSession(w http.ResponseWriter, r *http.Request) {
	user, ok := getUserFromCtx(w, r)
	if !ok {
		return
	}
	if user.Role != "psychologist" {
		utils.WriteError(w, http.StatusForbidden, "ACCESS_DENIED", "Only psychologists can complete sessions")
		return
	}

	sessionID, err := strconv.ParseUint(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, "INVALID_ID", "Invalid session ID")
		return
	}

	var session models.Session
	if err := db.DB.Where("id = ? AND psychologist_id = ?", sessionID, user.ID).First(&session).Error; err != nil {
		utils.WriteError(w, http.StatusNotFound, "NOT_FOUND", "Session not found")
		return
	}

	if session.Status != "confirmed" {
		utils.WriteError(w, http.StatusConflict, "INVALID_STATUS", "Only confirmed sessions can be completed")
		return
	}

	if err := db.DB.Model(&session).Update("status", "completed").Error; err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "DB_ERROR", "Failed to complete session")
		return
	}

	utils.WriteJSON(w, http.StatusOK, map[string]interface{}{"success": true, "message": "Session completed"})
}
