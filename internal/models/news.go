package models

import (
	"time"

	"gorm.io/gorm"
)

// News represents a news article
type News struct {
	ID         uint64         `json:"id" gorm:"primaryKey;autoIncrement"`
	Title      string         `json:"title" gorm:"not null;size:255"`
	Content    string         `json:"content" gorm:"type:text;not null"`
	Summary    string         `json:"summary" gorm:"size:500"`           // Short description for news list
	ImageURL   *string        `json:"imageUrl" gorm:"size:255"`          // Main image URL
	IsPublic   bool           `json:"isPublic" gorm:"default:true"`      // Public or only for registered users
	Published  bool           `json:"published" gorm:"default:false"`    // Published or draft
	ShowOnHome bool           `json:"showOnHome" gorm:"default:false"`   // Show on home page
	AuthorID   uint64         `json:"authorId" gorm:"not null"`          // Administrator-author ID
	Author     Administrator  `json:"author" gorm:"foreignKey:AuthorID"` // Relation to administrator
	Views      int            `json:"views" gorm:"default:0"`            // Number of views
	CreatedAt  time.Time      `json:"createdAt"`
	UpdatedAt  time.Time      `json:"updatedAt"`
	DeletedAt  gorm.DeletedAt `json:"-" gorm:"index"`
}
