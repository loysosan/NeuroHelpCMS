package unit_tests

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"strconv"
	"testing"
	"time"
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
		&models.Skill{},
		&models.Category{},
	)
	suite.Require().NoError(err)

	// Настройка роутера
	suite.router = chi.NewRouter()
	suite.setupRoutes()
}

func (suite *AdminHandlersTestSuite) SetupTest() {
	// Отключаем внешние ключи для очистки
	suite.db.Exec("SET FOREIGN_KEY_CHECKS = 0")

	// Очищаем таблицы в правильном порядке
	suite.db.Exec("TRUNCATE TABLE psychologist_skills")
	suite.db.Exec("TRUNCATE TABLE portfolios")
	suite.db.Exec("TRUNCATE TABLE news")
	suite.db.Exec("TRUNCATE TABLE users")
	suite.db.Exec("TRUNCATE TABLE skills")
	suite.db.Exec("TRUNCATE TABLE categories")
	suite.db.Exec("TRUNCATE TABLE administrators")
	suite.db.Exec("TRUNCATE TABLE plans")

	// Включаем внешние ключи обратно
	suite.db.Exec("SET FOREIGN_KEY_CHECKS = 1")
}

func (suite *AdminHandlersTestSuite) setupRoutes() {
	suite.router.Route("/api/admin", func(r chi.Router) {
		r.Use(suite.mockAdminMiddleware)
		r.Post("/users", handlers.CreateUser)
		r.Get("/users", handlers.GetAllUsers)
		r.Get("/users/{id}", handlers.GetUser)
		r.Put("/users/{id}", handlers.UpdateUser)
		r.Post("/skills", handlers.CreateSkill)
		r.Get("/skills", handlers.GetSkills)
	})
}

func (suite *AdminHandlersTestSuite) mockAdminMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		admin := &models.Administrator{
			ID:       1,
			Username: "test_admin",
			Role:     "admin",
		}
		ctx := context.WithValue(r.Context(), "admin", admin)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// Helper method для создания тестового пользователя
func (suite *AdminHandlersTestSuite) createTestUser() *models.User {
	// Используем временную метку для уникальности
	timestamp := time.Now().UnixNano()
	user := &models.User{
		FirstName: "John",
		LastName:  "Doe",
		Email:     fmt.Sprintf("john.doe.%d@example.com", timestamp),
		Role:      "client",
		Status:    "Active",
		Verified:  true,
	}
	err := suite.db.Create(user).Error
	suite.Require().NoError(err)
	return user
}

// Helper method для создания тестового skill
func (suite *AdminHandlersTestSuite) createTestSkill() *models.Skill {
	skill := &models.Skill{
		Name:        "Test Skill",
		Description: "Test skill description",
		CategoryID:  1,
	}
	err := suite.db.Create(skill).Error
	suite.Require().NoError(err)
	return skill
}

// Helper method для создания тестовой категории
func (suite *AdminHandlersTestSuite) createTestCategory() *models.Category {
	category := &models.Category{
		Name:        "Test Category",
		Description: "Test category description",
	}
	err := suite.db.Create(category).Error
	suite.Require().NoError(err)
	return category
}

// ============== ТЕСТЫ ДЛЯ GetUser ==============

func (suite *AdminHandlersTestSuite) TestGetUser_Success() {
	// Создаем тестового пользователя
	user := suite.createTestUser()

	req := httptest.NewRequest("GET", fmt.Sprintf("/api/admin/users/%d", user.ID), nil)
	w := httptest.NewRecorder()

	// Добавляем параметр в контекст
	rctx := chi.NewRouteContext()
	rctx.URLParams.Add("id", strconv.FormatUint(user.ID, 10))
	req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, rctx))

	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusOK, w.Code)

	var responseUser models.User
	err := json.Unmarshal(w.Body.Bytes(), &responseUser)
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), user.ID, responseUser.ID)
	assert.Equal(suite.T(), user.Email, responseUser.Email)
	assert.Equal(suite.T(), user.FirstName, responseUser.FirstName)
	assert.Equal(suite.T(), user.LastName, responseUser.LastName)
}

func (suite *AdminHandlersTestSuite) TestGetUser_NotFound() {
	req := httptest.NewRequest("GET", "/api/admin/users/999", nil)
	w := httptest.NewRecorder()

	// Добавляем параметр в контекст
	rctx := chi.NewRouteContext()
	rctx.URLParams.Add("id", "999")
	req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, rctx))

	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusNotFound, w.Code)
}

func (suite *AdminHandlersTestSuite) TestGetUser_InvalidID() {
	req := httptest.NewRequest("GET", "/api/admin/users/invalid", nil)
	w := httptest.NewRecorder()

	// Добавляем параметр в контекст
	rctx := chi.NewRouteContext()
	rctx.URLParams.Add("id", "invalid")
	req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, rctx))

	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusBadRequest, w.Code)
}

// ============== ТЕСТЫ ДЛЯ UpdateUser ==============

func (suite *AdminHandlersTestSuite) TestUpdateUser_Success() {
	// Создаем тестового пользователя
	user := suite.createTestUser()

	updateData := map[string]interface{}{
		"firstName": "Jane",
		"lastName":  "Smith",
		"email":     "jane.smith@example.com",
		"role":      "psychologist",
		"status":    "Active",
		"verified":  true,
	}

	body, _ := json.Marshal(updateData)
	req := httptest.NewRequest("PUT", fmt.Sprintf("/api/admin/users/%d", user.ID), bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	// Добавляем параметр в контекст
	rctx := chi.NewRouteContext()
	rctx.URLParams.Add("id", strconv.FormatUint(user.ID, 10))
	req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, rctx))

	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusOK, w.Code)

	// Проверяем, что пользователь действительно обновился
	var updatedUser models.User
	err := suite.db.First(&updatedUser, user.ID).Error
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), "Jane", updatedUser.FirstName)
	assert.Equal(suite.T(), "Smith", updatedUser.LastName)
	assert.Equal(suite.T(), "jane.smith@example.com", updatedUser.Email)
	assert.Equal(suite.T(), "psychologist", updatedUser.Role)
}

func (suite *AdminHandlersTestSuite) TestUpdateUser_NotFound() {
	updateData := map[string]interface{}{
		"firstName": "Jane",
		"lastName":  "Smith",
	}

	body, _ := json.Marshal(updateData)
	req := httptest.NewRequest("PUT", "/api/admin/users/999", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	// Добавляем параметр в контекст
	rctx := chi.NewRouteContext()
	rctx.URLParams.Add("id", "999")
	req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, rctx))

	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusNotFound, w.Code)
}

func (suite *AdminHandlersTestSuite) TestUpdateUser_InvalidJSON() {
	user := suite.createTestUser()

	req := httptest.NewRequest("PUT", fmt.Sprintf("/api/admin/users/%d", user.ID), bytes.NewBuffer([]byte("invalid json")))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	// Добавляем параметр в контекст
	rctx := chi.NewRouteContext()
	rctx.URLParams.Add("id", strconv.FormatUint(user.ID, 10))
	req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, rctx))

	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusBadRequest, w.Code)
}

// ============== ТЕСТЫ ДЛЯ CreateSkill ==============

func (suite *AdminHandlersTestSuite) TestCreateSkill_Success() {
	// Создаем тестовую категорию
	category := suite.createTestCategory()

	skillData := map[string]interface{}{
		"name":        "Communication",
		"description": "Excellent communication skills",
		"categoryId":  category.ID,
	}

	body, _ := json.Marshal(skillData)
	req := httptest.NewRequest("POST", "/api/admin/skills", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusCreated, w.Code)

	// Проверяем, что skill создан в БД
	var skill models.Skill
	err := suite.db.Where("name = ?", "Communication").First(&skill).Error
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), "Communication", skill.Name)
	assert.Equal(suite.T(), "Excellent communication skills", skill.Description)
	assert.Equal(suite.T(), category.ID, skill.CategoryID)
}

func (suite *AdminHandlersTestSuite) TestCreateSkill_InvalidJSON() {
	req := httptest.NewRequest("POST", "/api/admin/skills", bytes.NewBuffer([]byte("invalid json")))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusBadRequest, w.Code)
}

func (suite *AdminHandlersTestSuite) TestCreateSkill_DuplicateName() {
	// Создаем тестовую категорию
	category := suite.createTestCategory()

	// Создаем первый skill
	skill1 := &models.Skill{
		Name:        "Communication",
		Description: "First communication skill",
		CategoryID:  category.ID,
	}
	err := suite.db.Create(skill1).Error
	suite.Require().NoError(err)

	// Пытаемся создать второй skill с таким же именем
	skillData := map[string]interface{}{
		"name":        "Communication",
		"description": "Second communication skill",
		"categoryId":  category.ID,
	}

	body, _ := json.Marshal(skillData)
	req := httptest.NewRequest("POST", "/api/admin/skills", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusConflict, w.Code)
}

// ============== ТЕСТЫ ДЛЯ GetSkills ==============

func (suite *AdminHandlersTestSuite) TestGetSkills_Success() {
	// Создаем тестовую категорию
	category := suite.createTestCategory()

	// Создаем несколько тестовых skills
	skills := []models.Skill{
		{
			Name:        "Communication",
			Description: "Communication skills",
			CategoryID:  category.ID,
		},
		{
			Name:        "Leadership",
			Description: "Leadership skills",
			CategoryID:  category.ID,
		},
	}

	for _, skill := range skills {
		err := suite.db.Create(&skill).Error
		suite.Require().NoError(err)
	}

	req := httptest.NewRequest("GET", "/api/admin/skills", nil)
	w := httptest.NewRecorder()

	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusOK, w.Code)

	var responseSkills []models.Skill
	err := json.Unmarshal(w.Body.Bytes(), &responseSkills)
	assert.NoError(suite.T(), err)
	assert.Len(suite.T(), responseSkills, 2)

	// Проверяем, что skills возвращены правильно
	skillNames := make([]string, len(responseSkills))
	for i, skill := range responseSkills {
		skillNames[i] = skill.Name
	}
	assert.Contains(suite.T(), skillNames, "Communication")
	assert.Contains(suite.T(), skillNames, "Leadership")
}

func (suite *AdminHandlersTestSuite) TestGetSkills_EmptyDatabase() {
	req := httptest.NewRequest("GET", "/api/admin/skills", nil)
	w := httptest.NewRecorder()

	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusOK, w.Code)

	var responseSkills []models.Skill
	err := json.Unmarshal(w.Body.Bytes(), &responseSkills)
	assert.NoError(suite.T(), err)
	assert.Len(suite.T(), responseSkills, 0)
}

// ============== СУЩЕСТВУЮЩИЕ ТЕСТЫ ==============

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
}

func (suite *AdminHandlersTestSuite) TearDownSuite() {
	// Очистка после всех тестов
	suite.db.Exec("DELETE FROM users")
	suite.db.Exec("DELETE FROM skills")
	suite.db.Exec("DELETE FROM categories")
	suite.db.Exec("DELETE FROM administrators")
	suite.db.Exec("DELETE FROM plans")

	if suite.db != nil {
		sqlDB, _ := suite.db.DB()
		sqlDB.Close()
	}
}

func TestAdminHandlersTestSuite(t *testing.T) {
	suite.Run(t, new(AdminHandlersTestSuite))
}
