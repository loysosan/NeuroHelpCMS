package models

import (
	"time"
)

type Skill struct {
	ID            uint64    `gorm:"primaryKey;autoIncrement"`
	Name          string    `gorm:"type:varchar(100);not null"`
	CategoryID    uint64    `gorm:""`
	Category      Category  `gorm:"foreignKey:CategoryID"`
	CreatedAt     time.Time `gorm:"autoCreateTime"`
	Psychologists []User    `gorm:"many2many:psychologist_skills"`
}

type Category struct {
	ID        uint64    `gorm:"primaryKey;autoIncrement"`
	Name      string    `gorm:"type:varchar(100);not null"`
	CreatedAt time.Time `gorm:"autoCreateTime"`
	Skills    []Skill   `gorm:"foreignKey:CategoryID;constraint:OnDelete:SET NULL"`
}

// PsychologistSkills represents the many-to-many relationship between Users and Skills
type PsychologistSkills struct {
	PsychologistID uint64 `gorm:"primaryKey"`
	SkillID        uint64 `gorm:"primaryKey"`
}

type Portfolio struct {
	ID             uint64     `gorm:"primaryKey;autoIncrement"`
	PsychologistID uint64     `gorm:"unique;not null"`
	Description    string     `gorm:"type:text"`
	Experience     int        `gorm:"type:int;default:0"`
	Education      string     `gorm:"type:text"`
	ContactEmail   *string    `gorm:"type:varchar(255)"`
	ContactPhone   *string    `gorm:"type:varchar(20)"`
	City           *string    `gorm:"type:varchar(100)"`
	Address        *string    `gorm:"type:varchar(255)"`
	DateOfBirth    *time.Time `gorm:"type:date"`
	Gender         *string    `gorm:"type:enum('male', 'female', 'notselected');default:'notselected'"`
	Telegram       *string    `gorm:"type:varchar(100)"`
	FacebookURL    *string    `gorm:"type:varchar(255)"`
	InstagramURL   *string    `gorm:"type:varchar(255)"`
	CreatedAt      time.Time  `gorm:"autoCreateTime"`
	UpdatedAt      time.Time  `gorm:"autoUpdateTime"`
	Diplomas       []Diploma  `gorm:"foreignKey:PortfolioID;constraint:OnDelete:RESTRICT"`
	Photos         []Photo    `gorm:"foreignKey:PortfolioID;constraint:OnDelete:RESTRICT"`
}

type Diploma struct {
	ID          uint64    `gorm:"primaryKey;autoIncrement"`
	PortfolioID uint64    `gorm:"not null"`
	Title       string    `gorm:"type:varchar(255);not null"`
	Institution string    `gorm:"type:varchar(255);not null"`
	IssueDate   time.Time `gorm:"type:date;not null"`
	DocumentURL *string   `gorm:"type:varchar(255)"`
	CreatedAt   time.Time `gorm:"autoCreateTime"`
}
