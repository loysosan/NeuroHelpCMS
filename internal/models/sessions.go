package models

import (
	"time"
)

// Session represents a consultation session between a client and a psychologist
type Session struct {
	ID             uint64  `gorm:"primaryKey;autoIncrement" json:"id"`
	PsychologistID uint64  `gorm:"" json:"psychologistId"`
	ClientID       *uint64 `json:"clientId"`
	AvailabilityID *uint64 `gorm:"" json:"availabilityId"`
	StartTime      time.Time `gorm:"not null" json:"startTime"`
	EndTime        time.Time `gorm:"not null" json:"endTime"`
	Status         string    `gorm:"type:enum('pending', 'confirmed', 'completed', 'canceled');not null" json:"status"`
	ClientNotes    *string   `gorm:"type:text" json:"clientNotes"`
	CreatedAt      time.Time `gorm:"autoCreateTime" json:"createdAt"`

	Psychologist User `gorm:"foreignKey:PsychologistID" json:"psychologist,omitempty"`
	Client       User `gorm:"foreignKey:ClientID" json:"client,omitempty"`
}

// Availability represents a psychologist's availability slot
type Availability struct {
	ID             uint64    `gorm:"primaryKey;autoIncrement" json:"id"`
	PsychologistID uint64    `gorm:"not null" json:"psychologistId"`
	StartTime      time.Time `gorm:"not null" json:"startTime"`
	EndTime        time.Time `gorm:"not null" json:"endTime"`
	Status         string    `gorm:"type:enum('available', 'booked');not null" json:"status"`
	CreatedAt      time.Time `gorm:"autoCreateTime" json:"createdAt"`
}
