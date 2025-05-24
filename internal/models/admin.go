package models

import (
	"time"
)

type Administrator struct {
	ID           uint64    `gorm:"primaryKey;autoIncrement"`
	Email        string    `gorm:"type:varchar(255);unique;not null"`
	Username  	 string    `gorm:"unique;not null"`
	Password 	 string    `gorm:"type:varchar(255);not null"`
	FirstName    string    `gorm:"type:varchar(100);not null"`
	LastName     string    `gorm:"type:varchar(100);not null"`
	Phone        *string   `gorm:"type:varchar(20)"`
	Status       string    `gorm:"type:enum('Active', 'Disabled');not null;default:Active"`
	Role         string    `gorm:"type:enum('admin', 'moderator');not null;default:'admin'"`

	CreatedAt    time.Time `gorm:"autoCreateTime"`
	UpdatedAt    time.Time `gorm:"autoUpdateTime"`
	MessagesSent []Message `gorm:"foreignKey:SenderID;constraint:OnDelete:SET NULL"`
	MessagesReceived []Message `gorm:"foreignKey:ReceiverID;constraint:OnDelete:SET NULL"`
}