package models

import (
	"time"
)

type Plan struct {
	ID           uint64    `gorm:"primaryKey;autoIncrement"`
	Name         string    `gorm:"type:varchar(100);not null"`
	Description  *string   `gorm:"type:text"`
	Price        float64   `gorm:"type:decimal(10,2);not null"`
	DurationDays *int      `gorm:"type:int"`
	Features     *string   `gorm:"type:text"`
	CreatedAt    time.Time `gorm:"autoCreateTime"`
	UpdatedAt    time.Time `gorm:"autoUpdateTime"`
}