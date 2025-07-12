package unit_tests

import (
	"context"
	"net/http"
	"os"
	"testing"
	"user-api/internal/db"
	"user-api/internal/handlers"
	"user-api/internal/models"

	"github.com/go-chi/chi/v5"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/suite"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

type AdminHandlersTestSuite struct {
	suite.Suite
	db     *gorm.DB
	router *chi.Mux
}

func (suite *AdminHandlersTestSuite) SetupSuite() {
	// Получаем параметры БД из переменных окружения (они установлены в docker-compose-test.yml)
	dbHost := os.Getenv("DB_HOST")
	if dbHost == "" {
		dbHost = "localhost"
	}

	dbUser := os.Getenv("DB_USER")
	if dbUser == "" {
		dbUser = "testuser"
	}

	dbPassword := os.Getenv("DB_PASSWORD")
	if dbPassword == "" {
		dbPassword = "testpass"
	}

	dbName := os.Getenv("DB_NAME")
	if dbName == "" {
		dbName = "testdb"
	}

	// Подключение к тестовой базе данных
	dsn := dbUser + ":" + dbPassword + "@tcp(" + dbHost + ":3306)/" + dbName + "?charset=utf8mb4&parseTime=True&loc=Local"
	testDB, err := gorm.Open(mysql.Open(dsn), &gorm.Config{})
	suite.Require().NoError(err)

	suite.db = testDB
	db.DB = testDB // Устанавливаем глобальную переменную для handlers

	// Миграция моделей
	err = testDB.AutoMigrate(
		&models.User{},
		&models.Administrator{},
		&models.Plan{},
	)
	suite.Require().NoError(err)

	// Настройка роутера
	suite.router = chi.NewRouter()
	suite.setupRoutes()
}

func (suite *AdminHandlersTestSuite) SetupTest() {
	// Очистка таблиц перед каждым тестом
	suite.db.Exec("DELETE FROM users")
	suite.db.Exec("DELETE FROM plans")
}

func (suite *AdminHandlersTestSuite) setupRoutes() {
	suite.router.Route("/api/admin", func(r chi.Router) {
		r.Use(suite.mockAdminMiddleware)
		r.Post("/users", handlers.CreateUser)
		r.Get("/users", handlers.GetAllUsers)
	})
}

func (suite *AdminHandlersTestSuite) mockAdminMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Мокаем администратора в контексте
		admin := &models.Administrator{
			ID:       1,
			Username: "test_admin",
			Role:     "admin",
		}
		ctx := context.WithValue(r.Context(), "admin", admin)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// Простой тест для проверки подключения к БД
func (suite *AdminHandlersTestSuite) TestDatabaseConnection() {
	// Проверяем, что мы можем подключиться к БД
	var count int64
	err := suite.db.Raw("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = ?", "testdb").Scan(&count).Error
	assert.NoError(suite.T(), err)
	assert.GreaterOrEqual(suite.T(), count, int64(0))
}

// Тест для создания пользователя напрямую в БД
func (suite *AdminHandlersTestSuite) TestCreateUserInDatabase() {
	user := &models.User{
		FirstName: "Test",
		LastName:  "User",
		Email:     "test@example.com",
		Role:      "client",
		Status:    "Active",
		Verified:  true,
	}

	err := suite.db.Create(user).Error
	assert.NoError(suite.T(), err)
	assert.NotZero(suite.T(), user.ID)

	// Проверяем, что пользователь создан
	var foundUser models.User
	err = suite.db.Where("email = ?", "test@example.com").First(&foundUser).Error
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), "Test", foundUser.FirstName)
}

// Тест для получения всех пользователей из БД
func (suite *AdminHandlersTestSuite) TestGetAllUsersFromDatabase() {
	// Создаем тестовых пользователей
	users := []models.User{
		{
			FirstName: "John",
			LastName:  "Doe",
			Email:     "john@example.com",
			Role:      "client",
			Status:    "Active",
			Verified:  true,
		},
		{
			FirstName: "Jane",
			LastName:  "Smith",
			Email:     "jane@example.com",
			Role:      "psychologist",
			Status:    "Active",
			Verified:  true,
		},
	}

	for _, user := range users {
		err := suite.db.Create(&user).Error
		assert.NoError(suite.T(), err)
	}

	// Получаем всех пользователей
	var allUsers []models.User
	err := suite.db.Find(&allUsers).Error
	assert.NoError(suite.T(), err)
	assert.Len(suite.T(), allUsers, 2)
}

func (suite *AdminHandlersTestSuite) TearDownSuite() {
	// Очистка после всех тестов
	suite.db.Exec("DELETE FROM users")
	suite.db.Exec("DELETE FROM administrators")
	suite.db.Exec("DELETE FROM plans")
}

// Запуск тестов
func TestAdminHandlersTestSuite(t *testing.T) {
	suite.Run(t, new(AdminHandlersTestSuite))
}
