package models

import (
	"time"
)

// Session represents a consultation session between a client and a psychologist
type Session struct {
	ID            uint64    `gorm:"primaryKey;autoIncrement"`
	PsychologistID uint64   `gorm:""`
	ClientID      uint64    `gorm:"not null"`
	StartTime     time.Time `gorm:"not null"`
	EndTime       time.Time `gorm:"not null"`
	Status        string    `gorm:"type:enum('pending', 'confirmed', 'completed', 'canceled');not null"`
	CreatedAt     time.Time `gorm:"autoCreateTime"`
}

// Availability represents a psychologist's availability slot
type Availability struct {
	ID            uint64    `gorm:"primaryKey;autoIncrement"`
	PsychologistID uint64   `gorm:"not null"`
	StartTime     time.Time `gorm:"not null"`
	EndTime       time.Time `gorm:"not null"`
	Status        string    `gorm:"type:enum('available', 'booked');not null"`
	CreatedAt     time.Time `gorm:"autoCreateTime"`
}