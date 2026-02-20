package hub

import (
	"encoding/json"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

// WSMessage is broadcast to all participants in a conversation
type WSMessage struct {
	ID             uint64    `json:"id"`
	ConversationID uint64    `json:"conversationId"`
	SenderID       uint64    `json:"senderId"`
	SenderName     string    `json:"senderName"`
	Content        string    `json:"content"`
	CreatedAt      time.Time `json:"createdAt"`
}

// Client represents an active WebSocket connection
type Client struct {
	Conn           *websocket.Conn
	ConversationID uint64
	UserID         uint64
	Send           chan WSMessage
}

// Hub manages all active WebSocket clients grouped by conversation
type Hub struct {
	mu      sync.RWMutex
	clients map[uint64][]*Client
}

var GlobalHub = &Hub{
	clients: make(map[uint64][]*Client),
}

func (h *Hub) Register(c *Client) {
	h.mu.Lock()
	defer h.mu.Unlock()
	h.clients[c.ConversationID] = append(h.clients[c.ConversationID], c)
}

func (h *Hub) Unregister(c *Client) {
	h.mu.Lock()
	defer h.mu.Unlock()
	list := h.clients[c.ConversationID]
	for i, conn := range list {
		if conn == c {
			h.clients[c.ConversationID] = append(list[:i], list[i+1:]...)
			break
		}
	}
	close(c.Send)
}

func (h *Hub) Broadcast(conversationID uint64, msg WSMessage) {
	h.mu.RLock()
	defer h.mu.RUnlock()
	for _, c := range h.clients[conversationID] {
		select {
		case c.Send <- msg:
		default:
		}
	}
}

// WritePump pumps messages from the Send channel to the WebSocket connection
func (c *Client) WritePump() {
	defer c.Conn.Close()
	for msg := range c.Send {
		data, err := json.Marshal(msg)
		if err != nil {
			return
		}
		if err := c.Conn.WriteMessage(websocket.TextMessage, data); err != nil {
			return
		}
	}
}
