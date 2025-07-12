package unit_tests

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
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
	// Получаем параметры БД из переменных окружения
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

// Тест для CreateUser - успешное создание
func (suite *AdminHandlersTestSuite) TestCreateUser_Success() {
	userData := map[string]interface{}{
		"firstName": "John",
		"lastName":  "Doe",
		"email":     "john.doe@example.com",
		"role":      "client",
		"password":  "password123",
		"status":    "Active",
		"verified":  true,
	}

	body, _ := json.Marshal(userData)
	req := httptest.NewRequest("POST", "/api/admin/users", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusCreated, w.Code)

	// Проверяем, что пользователь создан в БД
	var user models.User
	err := suite.db.Where("email = ?", "john.doe@example.com").First(&user).Error
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), "John", user.FirstName)
	assert.Equal(suite.T(), "Doe", user.LastName)
	assert.Equal(suite.T(), "client", user.Role)
}

// Тест для CreateUser - невалидный JSON
func (suite *AdminHandlersTestSuite) TestCreateUser_InvalidJSON() {
	req := httptest.NewRequest("POST", "/api/admin/users", bytes.NewBuffer([]byte("invalid json")))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusBadRequest, w.Code)
}

// Тест для GetAllUsers - успешное получение списка
func (suite *AdminHandlersTestSuite) TestGetAllUsers_Success() {
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
		suite.db.Create(&user)
	}

	req := httptest.NewRequest("GET", "/api/admin/users", nil)
	w := httptest.NewRecorder()

	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusOK, w.Code)

	var responseUsers []models.User
	err := json.Unmarshal(w.Body.Bytes(), &responseUsers)
	assert.NoError(suite.T(), err)
	assert.Len(suite.T(), responseUsers, 2)
}

// Тест для GetAllUsers - пустая база данных
func (suite *AdminHandlersTestSuite) TestGetAllUsers_EmptyDatabase() {
	req := httptest.NewRequest("GET", "/api/admin/users", nil)
	w := httptest.NewRecorder()

	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusOK, w.Code)

	var responseUsers []models.User
	err := json.Unmarshal(w.Body.Bytes(), &responseUsers)
	assert.NoError(suite.T(), err)
	assert.Len(suite.T(), responseUsers, 0)
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
