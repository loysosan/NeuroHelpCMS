package models

type Skills struct {
	ID          uint   `json:"id" gorm:"primaryKey"`
	NameSkill   string `json:"name_skill" gorm:"not null"`
	Description string `json:"description,omitempty"`
}