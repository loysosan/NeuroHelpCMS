package db

import (
	"fmt"
	"log"
	"os"
	"user-api/internal/models"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

var DB *gorm.DB

func Connect() {
	dsn := fmt.Sprintf(
		"%s:%s@tcp(%s:%s)/%s?charset=utf8mb4&parseTime=True&loc=Local",
		os.Getenv("DB_USER"),
		os.Getenv("DB_PASSWORD"),
		os.Getenv("DB_HOST"),
		os.Getenv("DB_PORT"),
		os.Getenv("DB_NAME"),
	)

	var err error
	DB, err = gorm.Open(mysql.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("Cant connect to database:", err)
	}

	DB.AutoMigrate(
		&models.Administrator{},
		&models.User{},
		&models.Plan{},
		&models.Category{},
		&models.Skill{},
		&models.PsychologistSkills{},
		&models.Portfolio{},
		&models.Education{},
		&models.Diploma{},
		&models.Language{},
		&models.Photo{},
		&models.Review{},
		&models.Rating{},
		&models.BlogPost{},
		&models.Session{},
		&models.Conversation{},
		&models.Message{},
		&models.Availability{},
		&models.News{},
		&models.Child{},
		&models.ScheduleTemplate{},
	)
}
