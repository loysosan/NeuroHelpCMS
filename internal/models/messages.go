package models

import "time"

// Conversation represents a chat thread between a client and a psychologist
type Conversation struct {
	ID             uint64     `gorm:"primaryKey;autoIncrement" json:"id"`
	ClientID       uint64     `gorm:"not null;index;uniqueIndex:uq_conversation" json:"clientId"`
	PsychologistID uint64     `gorm:"not null;index;uniqueIndex:uq_conversation" json:"psychologistId"`
	Client         *User      `gorm:"foreignKey:ClientID" json:"client,omitempty"`
	Psychologist   *User      `gorm:"foreignKey:PsychologistID" json:"psychologist,omitempty"`
	LastMessageAt  *time.Time `json:"lastMessageAt"`
	CreatedAt      time.Time  `gorm:"autoCreateTime" json:"createdAt"`
	UpdatedAt      time.Time  `gorm:"autoUpdateTime" json:"updatedAt"`
}

// Message represents a single message within a conversation
type Message struct {
	ID             uint64    `gorm:"primaryKey;autoIncrement" json:"id"`
	ConversationID uint64    `gorm:"not null;index" json:"conversationId"`
	SenderID       *uint64   `gorm:"index" json:"senderId"`
	Sender         *User     `gorm:"foreignKey:SenderID" json:"sender,omitempty"`
	Content        string    `gorm:"type:text;not null" json:"content"`
	IsRead         bool      `gorm:"default:false" json:"isRead"`
	CreatedAt      time.Time `gorm:"autoCreateTime" json:"createdAt"`
}
