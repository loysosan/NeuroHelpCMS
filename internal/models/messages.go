package models

import (
	"time"
)

// Message represents a message between users or admins
type Message struct {
	ID           uint64    `gorm:"primaryKey;autoIncrement"`
	SenderID     uint64    `gorm:""`
	SenderType   string    `gorm:"type:enum('user', 'admin');not null"`
	ReceiverID   uint64    `gorm:""`
	ReceiverType string    `gorm:"type:enum('user', 'admin');not null"`
	Content      string    `gorm:"type:text;not null"`
	CreatedAt    time.Time `gorm:"autoCreateTime"`
}