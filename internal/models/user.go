package models

import (
	"time"
)

type User struct {

	ID           uint64    `gorm:"primaryKey;autoIncrement"`
	Email        string    `gorm:"type:varchar(255);unique;not null"`
	Password	 string    `gorm:"type:varchar(255);not null"`
	Role         string    `gorm:"type:enum('client', 'psychologist');not null"`
	FirstName    string    `gorm:"type:varchar(100);not null"`
	LastName     string    `gorm:"type:varchar(100);not null"`
	Phone        *string   `gorm:"type:varchar(20)"`
	Status       string    `gorm:"type:enum('Active', 'Disabled');not null;default:Disabled"`
	PlanID       *uint64   `gorm:""`
	CreatedAt    time.Time `gorm:"autoCreateTime"`
	UpdatedAt    time.Time `gorm:"autoUpdateTime"`
	// Email verification status and token
	Verified          bool      `gorm:"not null;default:false"`
	VerificationToken string    `gorm:"type:varchar(64);index"`
	TokenSentAt       time.Time `gorm:"autoCreateTime"`
	Portfolio    Portfolio `gorm:"foreignKey:PsychologistID;constraint:OnDelete:RESTRICT"`
    Skills []Skill `gorm:"many2many:psychologist_skills;joinForeignKey:PsychologistID;joinReferences:SkillID"`
	Reviews      []Review  `gorm:"foreignKey:PsychologistID;constraint:OnDelete:RESTRICT"`
	BlogPosts    []BlogPost `gorm:"foreignKey:PsychologistID;constraint:OnDelete:RESTRICT"`
	Sessions     []Session `gorm:"foreignKey:PsychologistID;constraint:OnDelete:SET NULL"`
	MessagesSent []Message `gorm:"foreignKey:SenderID;constraint:OnDelete:SET NULL"`
	MessagesReceived []Message `gorm:"foreignKey:ReceiverID;constraint:OnDelete:SET NULL"`
	Availability []Availability `gorm:"foreignKey:PsychologistID;constraint:OnDelete:RESTRICT"`
	Rating       Rating    `gorm:"foreignKey:PsychologistID;constraint:OnDelete:RESTRICT"`
	RefreshToken string `gorm:"type:varchar(512);"`

	
}

type Photo struct {
	ID          uint64    `gorm:"primaryKey;autoIncrement"`
	PortfolioID uint64    `gorm:"not null"`
	URL         string    `gorm:"type:varchar(255);not null"`
	CreatedAt   time.Time `gorm:"autoCreateTime"`
}

// Review represents a client's review of a psychologist\
type Review struct {
	ID            uint64    `gorm:"primaryKey;autoIncrement"`
	PsychologistID uint64   `gorm:"not null"`
	ClientID      uint64    `gorm:"not null"`
	Rating        int       `gorm:"type:int;check:rating >= 1 AND rating <= 5;not null"`
	Comment       *string   `gorm:"type:text"`
	CreatedAt     time.Time `gorm:"autoCreateTime"`
}

// Rating represents a psychologist's average rating
type Rating struct {
	PsychologistID uint64    `gorm:"primaryKey"`
	AverageRating  float64   `gorm:"type:float;not null"`
	ReviewCount   int       `gorm:"type:int;not null"`
	UpdatedAt     time.Time `gorm:"autoUpdateTime"`
}