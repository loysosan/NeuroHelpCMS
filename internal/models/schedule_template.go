package models

import "time"

// ScheduleTemplate represents a recurring weekly availability pattern for a psychologist
type ScheduleTemplate struct {
	ID                  uint64    `gorm:"primaryKey;autoIncrement" json:"id"`
	PsychologistID      uint64    `gorm:"not null" json:"psychologistId"`
	DayOfWeek           int       `gorm:"type:tinyint;not null" json:"dayOfWeek"` // 0=Пн..6=Нд
	StartTime           string    `gorm:"type:varchar(8);not null" json:"startTime"` // "HH:MM"
	EndTime             string    `gorm:"type:varchar(8);not null" json:"endTime"`
	SlotDurationMinutes int       `gorm:"default:60;not null" json:"slotDurationMinutes"`
	IsActive            bool      `gorm:"default:true" json:"isActive"`
	CreatedAt           time.Time `gorm:"autoCreateTime" json:"createdAt"`

	Psychologist *User `gorm:"foreignKey:PsychologistID" json:"psychologist,omitempty"`
}
