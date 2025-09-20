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
	ID             uint64      `gorm:"primaryKey;autoIncrement"`
	PsychologistID uint64      `gorm:"unique;not null"`
	Description    string      `gorm:"type:text"`
	Experience     int         `gorm:"type:int;default:0"`
	ContactEmail   *string     `gorm:"type:varchar(255)"`
	ContactPhone   *string     `gorm:"type:varchar(20)"`
	City           *string     `gorm:"type:varchar(100)"`
	Address        *string     `gorm:"type:varchar(255)"`
	DateOfBirth    *time.Time  `gorm:"type:date"`
	Gender         *string     `gorm:"type:enum('male', 'female', 'notselected');default:'notselected'"`
	Telegram       *string     `gorm:"type:varchar(100)"`
	FacebookURL    *string     `gorm:"type:varchar(255)"`
	InstagramURL   *string     `gorm:"type:varchar(255)"`
	VideoURL       *string     `gorm:"type:varchar(255)"`
	ClientAgeMin   *int        `gorm:"type:int;comment:Minimum client age"`
	ClientAgeMax   *int        `gorm:"type:int;comment:Maximum client age"`
	Rate           *float64    `gorm:"type:decimal(10,2);comment:Hourly rate in currency"`
	CreatedAt      time.Time   `gorm:"autoCreateTime"`
	UpdatedAt      time.Time   `gorm:"autoUpdateTime"`
	Educations     []Education `gorm:"foreignKey:PortfolioID;constraint:OnDelete:RESTRICT"`
	Diplomas       []Diploma   `gorm:"foreignKey:PortfolioID;constraint:OnDelete:RESTRICT"`
	Photos         []Photo     `gorm:"foreignKey:PortfolioID;constraint:OnDelete:RESTRICT"`
	Languages      []Language  `gorm:"foreignKey:PortfolioID;constraint:OnDelete:RESTRICT"`
}

type Education struct {
	ID          uint64    `gorm:"primaryKey;autoIncrement"`
	PortfolioID uint64    `gorm:"not null"`
	Title       string    `gorm:"type:varchar(255);not null"`
	Institution string    `gorm:"type:varchar(255);not null"`
	IssueDate   time.Time `gorm:"type:date;not null"`
	DocumentURL *string   `gorm:"type:varchar(255)"`
	CreatedAt   time.Time `gorm:"autoCreateTime"`
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

type Child struct {
	ID        uint64    `gorm:"primaryKey;autoIncrement"`
	ClientID  uint64    `gorm:"unique;not null;comment:Reference to the client user"`
	Age       int       `gorm:"type:int;not null;comment:Child's age"`
	Problem   string    `gorm:"type:text;not null;comment:Description of the child's problem"`
	Gender    string    `gorm:"type:enum('male', 'female', 'notspecified');not null;default:'notspecified';comment:Child's gender"`
	CreatedAt time.Time `gorm:"autoCreateTime"`
	UpdatedAt time.Time `gorm:"autoUpdateTime"`
}

type Language struct {
	ID          uint64    `gorm:"primaryKey;autoIncrement"`
	PortfolioID uint64    `gorm:"not null"`
	Name        string    `gorm:"type:varchar(50);not null;comment:Language name (e.g., Ukrainian, English)"`
	Proficiency string    `gorm:"type:enum('native', 'fluent', 'intermediate', 'basic');not null;default:'intermediate';comment:Proficiency level"`
	CreatedAt   time.Time `gorm:"autoCreateTime"`
}
