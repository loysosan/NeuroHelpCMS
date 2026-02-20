package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"user-api/internal/db"
	"user-api/internal/hub"
	"user-api/internal/models"
	"user-api/internal/utils"

	"github.com/go-chi/chi/v5"
	"github.com/gorilla/websocket"
)

var wsUpgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin:     func(r *http.Request) bool { return true },
}

// StartConversation — POST /api/conversations
// Only clients can initiate a conversation. Returns existing conversation if already exists.
func StartConversation(w http.ResponseWriter, r *http.Request) {
	email := r.Context().Value("username").(string)
	role := r.Context().Value("role").(string)

	if role != "client" {
		utils.WriteError(w, http.StatusForbidden, "FORBIDDEN", "Only clients can start conversations")
		return
	}

	var currentUser models.User
	if err := db.DB.Where("email = ?", email).First(&currentUser).Error; err != nil {
		utils.WriteError(w, http.StatusUnauthorized, "USER_NOT_FOUND", "User not found")
		return
	}

	var req struct {
		PsychologistID uint64 `json:"psychologistId"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.PsychologistID == 0 {
		utils.WriteError(w, http.StatusBadRequest, "INVALID_REQUEST", "psychologistId is required")
		return
	}

	var psychologist models.User
	if err := db.DB.Where("id = ? AND role = ?", req.PsychologistID, "psychologist").First(&psychologist).Error; err != nil {
		utils.WriteError(w, http.StatusNotFound, "NOT_FOUND", "Psychologist not found")
		return
	}

	// Find existing or create new conversation
	var conversation models.Conversation
	result := db.DB.Where("client_id = ? AND psychologist_id = ?", currentUser.ID, req.PsychologistID).First(&conversation)
	if result.Error != nil {
		conversation = models.Conversation{
			ClientID:       currentUser.ID,
			PsychologistID: req.PsychologistID,
		}
		if err := db.DB.Create(&conversation).Error; err != nil {
			utils.WriteError(w, http.StatusInternalServerError, "DB_ERROR", "Failed to create conversation")
			return
		}
	}

	utils.WriteJSON(w, http.StatusOK, conversation)
}

// conversationItem extends Conversation with a computed unread count
type conversationItem struct {
	models.Conversation
	UnreadCount int64 `json:"unreadCount"`
}

// GetMyConversations — GET /api/conversations
// Returns all conversations for the authenticated user, sorted by last message, with unread counts.
func GetMyConversations(w http.ResponseWriter, r *http.Request) {
	email := r.Context().Value("username").(string)
	role := r.Context().Value("role").(string)

	var currentUser models.User
	if err := db.DB.Where("email = ?", email).First(&currentUser).Error; err != nil {
		utils.WriteError(w, http.StatusUnauthorized, "USER_NOT_FOUND", "User not found")
		return
	}

	var conversations []models.Conversation
	query := db.DB.
		Preload("Client").
		Preload("Psychologist").
		Preload("Psychologist.Portfolio").
		Preload("Psychologist.Portfolio.Photos")

	if role == "client" {
		query = query.Where("client_id = ?", currentUser.ID)
	} else {
		query = query.Where("psychologist_id = ?", currentUser.ID)
	}

	if err := query.Order("COALESCE(last_message_at, created_at) DESC").Find(&conversations).Error; err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "DB_ERROR", "Failed to get conversations")
		return
	}

	result := make([]conversationItem, len(conversations))
	for i, conv := range conversations {
		// Count unread messages sent by the other party
		var unreadCount int64
		db.DB.Model(&models.Message{}).
			Where("conversation_id = ? AND sender_id != ? AND is_read = false", conv.ID, currentUser.ID).
			Count(&unreadCount)

		// Strip sensitive fields
		if conv.Client != nil {
			conv.Client.Password = ""
			conv.Client.RefreshToken = ""
			conv.Client.VerificationToken = ""
		}
		if conv.Psychologist != nil {
			conv.Psychologist.Password = ""
			conv.Psychologist.RefreshToken = ""
			conv.Psychologist.VerificationToken = ""
		}

		result[i] = conversationItem{Conversation: conv, UnreadCount: unreadCount}
	}

	utils.WriteJSON(w, http.StatusOK, result)
}

// GetUnreadCount — GET /api/conversations/unread
// Returns total count of unread messages across all conversations for the current user.
func GetUnreadCount(w http.ResponseWriter, r *http.Request) {
	email := r.Context().Value("username").(string)

	var currentUser models.User
	if err := db.DB.Where("email = ?", email).First(&currentUser).Error; err != nil {
		utils.WriteError(w, http.StatusUnauthorized, "USER_NOT_FOUND", "User not found")
		return
	}

	var unreadCount int64
	if currentUser.Role == "client" {
		db.DB.Model(&models.Message{}).
			Joins("JOIN conversations ON conversations.id = messages.conversation_id").
			Where("conversations.client_id = ? AND messages.sender_id != ? AND messages.is_read = false",
				currentUser.ID, currentUser.ID).
			Count(&unreadCount)
	} else {
		db.DB.Model(&models.Message{}).
			Joins("JOIN conversations ON conversations.id = messages.conversation_id").
			Where("conversations.psychologist_id = ? AND messages.sender_id != ? AND messages.is_read = false",
				currentUser.ID, currentUser.ID).
			Count(&unreadCount)
	}

	utils.WriteJSON(w, http.StatusOK, map[string]int64{"count": unreadCount})
}

// GetConversationMessages — GET /api/conversations/{id}/messages
// Returns paginated messages for a conversation the user participates in.
func GetConversationMessages(w http.ResponseWriter, r *http.Request) {
	email := r.Context().Value("username").(string)

	convID, err := strconv.ParseUint(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, "INVALID_ID", "Invalid conversation id")
		return
	}

	var currentUser models.User
	if err := db.DB.Where("email = ?", email).First(&currentUser).Error; err != nil {
		utils.WriteError(w, http.StatusUnauthorized, "USER_NOT_FOUND", "User not found")
		return
	}

	var conv models.Conversation
	if err := db.DB.First(&conv, convID).Error; err != nil {
		utils.WriteError(w, http.StatusNotFound, "NOT_FOUND", "Conversation not found")
		return
	}
	if conv.ClientID != currentUser.ID && conv.PsychologistID != currentUser.ID {
		utils.WriteError(w, http.StatusForbidden, "FORBIDDEN", "Access denied")
		return
	}

	limit := 50
	offset := 0
	if l := r.URL.Query().Get("limit"); l != "" {
		if v, err := strconv.Atoi(l); err == nil && v > 0 {
			limit = v
		}
	}
	if o := r.URL.Query().Get("offset"); o != "" {
		if v, err := strconv.Atoi(o); err == nil && v >= 0 {
			offset = v
		}
	}

	var messages []models.Message
	if err := db.DB.Where("conversation_id = ?", convID).
		Preload("Sender").
		Order("created_at ASC").
		Limit(limit).
		Offset(offset).
		Find(&messages).Error; err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "DB_ERROR", "Failed to get messages")
		return
	}

	// Strip sensitive fields from sender
	for i := range messages {
		if messages[i].Sender != nil {
			messages[i].Sender.Password = ""
			messages[i].Sender.RefreshToken = ""
			messages[i].Sender.VerificationToken = ""
		}
	}

	// Mark incoming messages as read
	db.DB.Model(&models.Message{}).
		Where("conversation_id = ? AND sender_id != ? AND is_read = false", convID, currentUser.ID).
		Update("is_read", true)

	utils.WriteJSON(w, http.StatusOK, messages)
}

// WSChat — GET /api/ws/{id}
// WebSocket endpoint. Authenticates via ?token= query param (browser WebSocket API has no custom headers).
func WSChat(w http.ResponseWriter, r *http.Request) {
	tokenStr := r.URL.Query().Get("token")
	if tokenStr == "" {
		http.Error(w, "Missing token", http.StatusUnauthorized)
		return
	}

	claims, err := utils.ParseAccessToken(tokenStr)
	if err != nil {
		http.Error(w, "Invalid token", http.StatusUnauthorized)
		return
	}

	convID, err := strconv.ParseUint(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		http.Error(w, "Invalid conversation id", http.StatusBadRequest)
		return
	}

	var currentUser models.User
	if err := db.DB.Where("email = ?", claims.Username).First(&currentUser).Error; err != nil {
		http.Error(w, "User not found", http.StatusUnauthorized)
		return
	}

	var conv models.Conversation
	if err := db.DB.First(&conv, convID).Error; err != nil {
		http.Error(w, "Conversation not found", http.StatusNotFound)
		return
	}
	if conv.ClientID != currentUser.ID && conv.PsychologistID != currentUser.ID {
		http.Error(w, "Forbidden", http.StatusForbidden)
		return
	}

	conn, err := wsUpgrader.Upgrade(w, r, nil)
	if err != nil {
		return
	}

	client := &hub.Client{
		Conn:           conn,
		ConversationID: convID,
		UserID:         currentUser.ID,
		Send:           make(chan hub.WSMessage, 64),
	}

	hub.GlobalHub.Register(client)
	defer hub.GlobalHub.Unregister(client)

	go client.WritePump()

	senderName := currentUser.FirstName + " " + currentUser.LastName

	// Read pump — blocks until the connection is closed
	for {
		_, raw, err := conn.ReadMessage()
		if err != nil {
			break
		}

		var incoming struct {
			Content string `json:"content"`
		}
		if err := json.Unmarshal(raw, &incoming); err != nil || incoming.Content == "" {
			continue
		}

		senderID := currentUser.ID
		msg := models.Message{
			ConversationID: convID,
			SenderID:       &senderID,
			Content:        incoming.Content,
		}
		if err := db.DB.Create(&msg).Error; err != nil {
			continue
		}

		now := time.Now()
		db.DB.Model(&models.Conversation{}).Where("id = ?", convID).Update("last_message_at", now)

		hub.GlobalHub.Broadcast(convID, hub.WSMessage{
			ID:             msg.ID,
			ConversationID: convID,
			SenderID:       currentUser.ID,
			SenderName:     senderName,
			Content:        incoming.Content,
			CreatedAt:      msg.CreatedAt,
		})
	}
}
