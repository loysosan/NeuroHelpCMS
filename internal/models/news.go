package models

import (
    "time"
    "gorm.io/gorm"
)

// News represents a news article
type News struct {
    ID          uint64         `json:"id" gorm:"primaryKey;autoIncrement"`
    Title       string         `json:"title" gorm:"not null;size:255"`
    Content     string         `json:"content" gorm:"type:text;not null"`
    Summary     string         `json:"summary" gorm:"size:500"` // Короткий опис для списку новин
    ImageURL    *string        `json:"imageUrl" gorm:"size:255"` // URL головного зображення
    IsPublic    bool           `json:"isPublic" gorm:"default:true"` // Публічна чи тільки для зареєстрованих
    Published   bool           `json:"published" gorm:"default:false"` // Опублікована чи чернетка
    AuthorID    uint64         `json:"authorId" gorm:"not null"` // ID адміністратора-автора
    Author      Administrator  `json:"author" gorm:"foreignKey:AuthorID"` // Зв'язок з адміністратором
    Views       int            `json:"views" gorm:"default:0"` // Кількість переглядів
    CreatedAt   time.Time      `json:"createdAt"`
    UpdatedAt   time.Time      `json:"updatedAt"`
    DeletedAt   gorm.DeletedAt `json:"-" gorm:"index"`
}