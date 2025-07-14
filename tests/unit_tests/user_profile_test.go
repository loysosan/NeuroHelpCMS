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

type UserProfileTestSuite struct {
	suite.Suite
	db     *gorm.DB
	router *chi.Mux
}

func (suite *UserProfileTestSuite) SetupSuite() {
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
		&models.Portfolio{},
		&models.Photo{},
		&models.Skill{},
		&models.Category{},
		&models.Rating{},
		&models.Review{},
	)
	suite.Require().NoError(err)

	// Настройка роутера
	suite.router = chi.NewRouter()
	suite.setupRoutes()
}

func (suite *UserProfileTestSuite) SetupTest() {
	// Disable foreign key checks
	suite.db.Exec("SET FOREIGN_KEY_CHECKS = 0")

	// Clear all tables
	suite.db.Exec("TRUNCATE TABLE users")
	suite.db.Exec("TRUNCATE TABLE portfolios")
	suite.db.Exec("TRUNCATE TABLE photos")
	suite.db.Exec("TRUNCATE TABLE skills")
	suite.db.Exec("TRUNCATE TABLE categories")
	suite.db.Exec("TRUNCATE TABLE psychologist_skills")
	suite.db.Exec("TRUNCATE TABLE ratings")
	suite.db.Exec("TRUNCATE TABLE reviews")

	// Enable foreign key checks
	suite.db.Exec("SET FOREIGN_KEY_CHECKS = 1")
}

func (suite *UserProfileTestSuite) setupRoutes() {
	suite.router.Route("/api/users", func(r chi.Router) {
		r.Get("/{id}", handlers.GetUserProfile)
		r.With(suite.mockUserMiddleware).Get("/self", handlers.GetSelfProfile)
		r.With(suite.mockUserMiddleware).Put("/self/updateuser", handlers.ClientSelfUpdate)
	})
}

func (suite *UserProfileTestSuite) mockUserMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Добавляем email в контекст для аутентификации
		ctx := context.WithValue(r.Context(), "email", "test@example.com")
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func (suite *UserProfileTestSuite) createTestUser() *models.User {
	timestamp := time.Now().UnixNano()
	user := &models.User{
		FirstName:         "John",
		LastName:          "Doe",
		Email:             fmt.Sprintf("john.doe.%d@example.com", timestamp),
		Password:          "hashedpassword",
		Role:              "client",
		Status:            "Active",
		Verified:          true,
		RefreshToken:      "refresh_token",
		VerificationToken: "verification_token",
	}
	err := suite.db.Create(user).Error
	suite.Require().NoError(err)
	return user
}

func (suite *UserProfileTestSuite) createTestPsychologist() *models.User {
	timestamp := time.Now().UnixNano()
	user := &models.User{
		FirstName:         "Jane",
		LastName:          "Smith",
		Email:             fmt.Sprintf("jane.smith.%d@example.com", timestamp),
		Password:          "hashedpassword",
		Role:              "psychologist",
		Status:            "Active",
		Verified:          true,
		RefreshToken:      "refresh_token",
		VerificationToken: "verification_token",
	}
	err := suite.db.Create(user).Error
	suite.Require().NoError(err)

	// Создаем портфолио
	portfolio := &models.Portfolio{
		PsychologistID: user.ID,
		Description:    "Test psychologist",
		Experience:     5, // Если это int
		Education:      "Master's degree",
		ContactEmail:   stringPtr("contact@example.com"), // Если это *string
		ContactPhone:   stringPtr("+1234567890"),         // Если это *string
	}
	err = suite.db.Create(portfolio).Error
	suite.Require().NoError(err)

	// Создаем фото
	photo := &models.Photo{
		PortfolioID: portfolio.ID,
		URL:         "https://example.com/photo.jpg",
	}
	err = suite.db.Create(photo).Error
	suite.Require().NoError(err)

	// Создаем категорию и навык
	category := &models.Category{
		Name: "Psychology",
	}
	err = suite.db.Create(category).Error
	suite.Require().NoError(err)

	skill := &models.Skill{
		Name:       "Therapy",
		CategoryID: category.ID,
	}
	err = suite.db.Create(skill).Error
	suite.Require().NoError(err)

	// Связываем навык с психологом
	err = suite.db.Exec("INSERT INTO psychologist_skills (psychologist_id, skill_id) VALUES (?, ?)", user.ID, skill.ID).Error
	suite.Require().NoError(err)

	// Создаем рейтинг
	rating := &models.Rating{
		PsychologistID: user.ID,
		AverageRating:  4.5,
		ReviewCount:    10,
	}
	err = suite.db.Create(rating).Error
	suite.Require().NoError(err)

	return user
}

func (suite *UserProfileTestSuite) createAuthenticatedUser() *models.User {
	user := &models.User{
		FirstName:         "Test",
		LastName:          "User",
		Email:             "test@example.com",
		Password:          "hashedpassword",
		Role:              "client",
		Status:            "Active",
		Verified:          true,
		Phone:             stringPtr("+1234567890"),
		RefreshToken:      "refresh_token",
		VerificationToken: "verification_token",
	}
	err := suite.db.Create(user).Error
	suite.Require().NoError(err)
	return user
}

func stringPtr(s string) *string {
	return &s
}

// ============== ТЕСТЫ ДЛЯ GetUserProfile ==============

func (suite *UserProfileTestSuite) TestGetUserProfile_Success() {
	user := suite.createTestUser()

	req := httptest.NewRequest("GET", fmt.Sprintf("/api/users/%d", user.ID), nil)
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

	// Проверяем, что конфиденциальные данные очищены
	assert.Empty(suite.T(), responseUser.Password)
	assert.Empty(suite.T(), responseUser.RefreshToken)
	assert.Empty(suite.T(), responseUser.VerificationToken)
}

func (suite *UserProfileTestSuite) TestGetUserProfile_PsychologistWithPortfolio() {
	user := suite.createTestPsychologist()

	req := httptest.NewRequest("GET", fmt.Sprintf("/api/users/%d", user.ID), nil)
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
	assert.Equal(suite.T(), "psychologist", responseUser.Role)
	assert.NotEmpty(suite.T(), responseUser.Portfolio)
	assert.NotEmpty(suite.T(), responseUser.Skills)
}

func (suite *UserProfileTestSuite) TestGetUserProfile_NotFound() {
	req := httptest.NewRequest("GET", "/api/users/999", nil)
	w := httptest.NewRecorder()

	// Добавляем параметр в контекст
	rctx := chi.NewRouteContext()
	rctx.URLParams.Add("id", "999")
	req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, rctx))

	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusNotFound, w.Code)
}

func (suite *UserProfileTestSuite) TestGetUserProfile_InvalidID() {
	req := httptest.NewRequest("GET", "/api/users/invalid", nil)
	w := httptest.NewRecorder()

	// Добавляем параметр в контекст
	rctx := chi.NewRouteContext()
	rctx.URLParams.Add("id", "invalid")
	req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, rctx))

	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusBadRequest, w.Code)
}

// ============== ТЕСТЫ ДЛЯ GetSelfProfile ==============

func (suite *UserProfileTestSuite) TestGetSelfProfile_Success() {
	user := suite.createAuthenticatedUser()

	req := httptest.NewRequest("GET", "/api/users/self", nil)
	w := httptest.NewRecorder()

	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusOK, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), float64(user.ID), response["id"])
	assert.Equal(suite.T(), user.Email, response["email"])
	assert.Equal(suite.T(), user.FirstName, response["firstName"])
	assert.Equal(suite.T(), user.LastName, response["lastName"])
	assert.Equal(suite.T(), user.Role, response["role"])
	assert.Equal(suite.T(), user.Status, response["status"])
	assert.Equal(suite.T(), user.Verified, response["verified"])
	assert.NotNil(suite.T(), response["skills"])
}

func (suite *UserProfileTestSuite) TestGetSelfProfile_PsychologistWithPortfolio() {
	// Создаем аутентифицированного психолога
	user := &models.User{
		FirstName: "Jane",
		LastName:  "Smith",
		Email:     "test@example.com", // Используем email из middleware
		Password:  "hashedpassword",
		Role:      "psychologist",
		Status:    "Active",
		Verified:  true,
	}
	err := suite.db.Create(user).Error
	suite.Require().NoError(err)

	// Создаем портфолио
	portfolio := &models.Portfolio{
		PsychologistID: user.ID,
		Description:    "Test psychologist",
		Experience:     5, // Если это int
		Education:      "Master's degree",
		ContactEmail:   stringPtr("contact@example.com"), // Если это *string
		ContactPhone:   stringPtr("+1234567890"),         // Если это *string
	}
	err = suite.db.Create(portfolio).Error
	suite.Require().NoError(err)

	// Создаем рейтинг
	rating := &models.Rating{
		PsychologistID: user.ID,
		AverageRating:  4.5,
		ReviewCount:    10,
	}
	err = suite.db.Create(rating).Error
	suite.Require().NoError(err)

	req := httptest.NewRequest("GET", "/api/users/self", nil)
	w := httptest.NewRecorder()

	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusOK, w.Code)

	var response map[string]interface{}
	err = json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), "psychologist", response["role"])
	assert.NotNil(suite.T(), response["portfolio"])
	assert.NotNil(suite.T(), response["rating"])

	// Проверяем данные портфолио
	portfolioData := response["portfolio"].(map[string]interface{})
	assert.Equal(suite.T(), "Test psychologist", portfolioData["description"])
	assert.Equal(suite.T(), float64(5), portfolioData["experience"]) // Если это int

	// Проверяем данные рейтинга
	ratingData := response["rating"].(map[string]interface{})
	assert.Equal(suite.T(), 4.5, ratingData["averageRating"])
	assert.Equal(suite.T(), float64(10), ratingData["reviewCount"])
}

func (suite *UserProfileTestSuite) TestGetSelfProfile_Unauthorized() {
	req := httptest.NewRequest("GET", "/api/users/self", nil)
	w := httptest.NewRecorder()

	// Создаем middleware без email в контексте
	mockMiddleware := func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			next.ServeHTTP(w, r)
		})
	}

	router := chi.NewRouter()
	router.With(mockMiddleware).Get("/api/users/self", handlers.GetSelfProfile)
	router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusUnauthorized, w.Code)
}

func (suite *UserProfileTestSuite) TestGetSelfProfile_UserNotFound() {
	req := httptest.NewRequest("GET", "/api/users/self", nil)
	w := httptest.NewRecorder()

	// Используем middleware с email, который не существует в БД
	mockMiddleware := func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			ctx := context.WithValue(r.Context(), "email", "nonexistent@example.com")
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}

	router := chi.NewRouter()
	router.With(mockMiddleware).Get("/api/users/self", handlers.GetSelfProfile)
	router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusNotFound, w.Code)
}

// ============== ТЕСТЫ ДЛЯ ClientSelfUpdate ==============

func (suite *UserProfileTestSuite) TestClientSelfUpdate_Success() {
	user := suite.createAuthenticatedUser()

	updateData := map[string]interface{}{
		"firstName": "Updated",
		"lastName":  "Name",
		"phone":     "+9876543210",
	}

	body, _ := json.Marshal(updateData)
	req := httptest.NewRequest("PUT", "/api/users/self/updateuser", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusOK, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), true, response["success"])
	assert.Equal(suite.T(), "Profile updated successfully", response["message"])
	assert.NotNil(suite.T(), response["data"])

	// Проверяем, что данные обновлены в БД
	var updatedUser models.User
	err = suite.db.First(&updatedUser, user.ID).Error
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), "Updated", updatedUser.FirstName)
	assert.Equal(suite.T(), "Name", updatedUser.LastName)
	assert.Equal(suite.T(), "+9876543210", *updatedUser.Phone)
}

func (suite *UserProfileTestSuite) TestClientSelfUpdate_WithNullPhone() {
	user := suite.createAuthenticatedUser()

	updateData := map[string]interface{}{
		"firstName": "Updated",
		"lastName":  "Name",
		"phone":     nil,
	}

	body, _ := json.Marshal(updateData)
	req := httptest.NewRequest("PUT", "/api/users/self/updateuser", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusOK, w.Code)

	// Проверяем, что телефон стал null
	var updatedUser models.User
	err := suite.db.First(&updatedUser, user.ID).Error
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), "Updated", updatedUser.FirstName)
	assert.Equal(suite.T(), "Name", updatedUser.LastName)
	assert.Nil(suite.T(), updatedUser.Phone)
}

func (suite *UserProfileTestSuite) TestClientSelfUpdate_InvalidJSON() {
	suite.createAuthenticatedUser()

	req := httptest.NewRequest("PUT", "/api/users/self/updateuser", bytes.NewBuffer([]byte("invalid json")))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusBadRequest, w.Code)
}

func (suite *UserProfileTestSuite) TestClientSelfUpdate_Unauthorized() {
	req := httptest.NewRequest("PUT", "/api/users/self/updateuser", bytes.NewBuffer([]byte("{}")))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	// Создаем middleware без email в контексте
	mockMiddleware := func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			next.ServeHTTP(w, r)
		})
	}

	router := chi.NewRouter()
	router.With(mockMiddleware).Put("/api/users/self/updateuser", handlers.ClientSelfUpdate)
	router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusUnauthorized, w.Code)
}

func (suite *UserProfileTestSuite) TestClientSelfUpdate_UserNotFound() {
	updateData := map[string]interface{}{
		"firstName": "Updated",
		"lastName":  "Name",
	}

	body, _ := json.Marshal(updateData)
	req := httptest.NewRequest("PUT", "/api/users/self/updateuser", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	// Используем middleware с email, который не существует в БД
	mockMiddleware := func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			ctx := context.WithValue(r.Context(), "email", "nonexistent@example.com")
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}

	router := chi.NewRouter()
	router.With(mockMiddleware).Put("/api/users/self/updateuser", handlers.ClientSelfUpdate)
	router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusNotFound, w.Code)
}

func (suite *UserProfileTestSuite) TearDownSuite() {
	// Очистка после всех тестов
	sqlDB, err := suite.db.DB()
	if err == nil {
		sqlDB.Close()
	}
}

func TestUserProfileTestSuite(t *testing.T) {
	suite.Run(t, new(UserProfileTestSuite))
}
