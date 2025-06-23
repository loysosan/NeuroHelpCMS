package models

import (
	"time"
)

// BlogPost represents a blog post by a psychologist
type BlogPost struct {
	ID            uint64    `gorm:"primaryKey;autoIncrement"`
	PsychologistID uint64   `gorm:"not null"`
	Title         string    `gorm:"type:varchar(255);not null"`
	Content       string    `gorm:"type:text;not null"`
	Visible       string    `gorm:"type:enum('public', 'registed', 'shadow', 'deleted');not null;default:'public'"`
	CreatedAt     time.Time `gorm:"autoCreateTime"`
	UpdatedAt     time.Time `gorm:"autoUpdateTime"`
}