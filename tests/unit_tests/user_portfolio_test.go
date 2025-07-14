package unit_tests

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strconv"
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

type UserPortfolioTestSuite struct {
	suite.Suite
	db     *gorm.DB
	router *chi.Mux
}

func (suite *UserPortfolioTestSuite) SetupSuite() {
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

func (suite *UserPortfolioTestSuite) SetupTest() {
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

	// Создаем директорию для загрузки тестовых файлов
	os.MkdirAll("./uploads/portfolio", 0755)
}

func (suite *UserPortfolioTestSuite) setupRoutes() {
	suite.router.Route("/api/users", func(r chi.Router) {
		r.With(suite.mockUserMiddleware).Put("/self/portfolio", handlers.UpdateSelfPortfolio)
		r.With(suite.mockUserMiddleware).Post("/portfolio/photo", handlers.UploadPortfolioPhoto)
		r.With(suite.mockUserMiddleware).Delete("/portfolio/photo/{photo_id}", handlers.DeletePortfolioPhoto)
	})
}

func (suite *UserPortfolioTestSuite) mockUserMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Добавляем email в контекст для аутентификации
		ctx := context.WithValue(r.Context(), "email", "test@example.com")
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func (suite *UserPortfolioTestSuite) createTestPsychologist() *models.User {
	user := &models.User{
		FirstName: "Jane",
		LastName:  "Smith",
		Email:     "test@example.com",
		Password:  "hashedpassword",
		Role:      "psychologist",
		Status:    "Active",
		Verified:  true,
	}
	err := suite.db.Create(user).Error
	suite.Require().NoError(err)
	return user
}

func (suite *UserPortfolioTestSuite) createTestClient() *models.User {
	user := &models.User{
		FirstName: "John",
		LastName:  "Doe",
		Email:     "test@example.com",
		Password:  "hashedpassword",
		Role:      "client",
		Status:    "Active",
		Verified:  true,
	}
	err := suite.db.Create(user).Error
	suite.Require().NoError(err)
	return user
}

func (suite *UserPortfolioTestSuite) createTestPortfolio(userID uint64) *models.Portfolio {
	portfolio := &models.Portfolio{
		PsychologistID: userID,
		Description:    "Test portfolio",
		Experience:     5,
		Education:      "Master's degree",
		ContactEmail:   stringPtr("contact@example.com"),
		ContactPhone:   stringPtr("+1234567890"),
	}
	err := suite.db.Create(portfolio).Error
	suite.Require().NoError(err)
	return portfolio
}

func (suite *UserPortfolioTestSuite) createTestPhoto(portfolioID uint64) *models.Photo {
	photo := &models.Photo{
		PortfolioID: portfolioID,
		URL:         "/uploads/portfolio/test.jpg",
	}
	err := suite.db.Create(photo).Error
	suite.Require().NoError(err)
	return photo
}

// ============== ТЕСТЫ ДЛЯ UpdateSelfPortfolio ==============

func (suite *UserPortfolioTestSuite) TestUpdateSelfPortfolio_CreateNew() {
	user := suite.createTestPsychologist()

	updateData := map[string]interface{}{
		"description":  "Updated portfolio description",
		"experience":   10,
		"education":    "PhD in Psychology",
		"contactEmail": "new.contact@example.com",
		"contactPhone": "+9876543210",
	}

	body, _ := json.Marshal(updateData)
	req := httptest.NewRequest("PUT", "/api/users/self/portfolio", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusOK, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), true, response["success"])
	assert.Equal(suite.T(), "Portfolio updated successfully", response["message"])
	assert.NotNil(suite.T(), response["data"])

	// Проверяем, что портфолио создано в БД
	var portfolio models.Portfolio
	err = suite.db.Where("psychologist_id = ?", user.ID).First(&portfolio).Error
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), "Updated portfolio description", portfolio.Description)
	assert.Equal(suite.T(), 10, portfolio.Experience)
	assert.Equal(suite.T(), "PhD in Psychology", portfolio.Education)
	assert.Equal(suite.T(), "new.contact@example.com", *portfolio.ContactEmail)
	assert.Equal(suite.T(), "+9876543210", *portfolio.ContactPhone)
}

func (suite *UserPortfolioTestSuite) TestUpdateSelfPortfolio_UpdateExisting() {
	user := suite.createTestPsychologist()
	portfolio := suite.createTestPortfolio(user.ID)

	updateData := map[string]interface{}{
		"description":  "Updated description",
		"experience":   15,
		"education":    "Updated education",
		"contactEmail": "updated@example.com",
		"contactPhone": "+1111111111",
	}

	body, _ := json.Marshal(updateData)
	req := httptest.NewRequest("PUT", "/api/users/self/portfolio", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusOK, w.Code)

	// Проверяем, что портфолио обновлено в БД
	var updatedPortfolio models.Portfolio
	err := suite.db.First(&updatedPortfolio, portfolio.ID).Error
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), "Updated description", updatedPortfolio.Description)
	assert.Equal(suite.T(), 15, updatedPortfolio.Experience)
	assert.Equal(suite.T(), "Updated education", updatedPortfolio.Education)
	assert.Equal(suite.T(), "updated@example.com", *updatedPortfolio.ContactEmail)
	assert.Equal(suite.T(), "+1111111111", *updatedPortfolio.ContactPhone)
}

func (suite *UserPortfolioTestSuite) TestUpdateSelfPortfolio_ClientForbidden() {
	_ = suite.createTestClient() // Используем _ чтобы избежать "declared and not used"

	updateData := map[string]interface{}{
		"description": "Test description",
	}

	body, _ := json.Marshal(updateData)
	req := httptest.NewRequest("PUT", "/api/users/self/portfolio", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusForbidden, w.Code)
}

func (suite *UserPortfolioTestSuite) TestUpdateSelfPortfolio_Unauthorized() {
	updateData := map[string]interface{}{
		"description": "Test description",
	}

	body, _ := json.Marshal(updateData)
	req := httptest.NewRequest("PUT", "/api/users/self/portfolio", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	// Создаем middleware без email в контексте
	mockMiddleware := func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			next.ServeHTTP(w, r)
		})
	}

	router := chi.NewRouter()
	router.With(mockMiddleware).Put("/api/users/self/portfolio", handlers.UpdateSelfPortfolio)
	router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusUnauthorized, w.Code)
}

func (suite *UserPortfolioTestSuite) TestUpdateSelfPortfolio_UserNotFound() {
	updateData := map[string]interface{}{
		"description": "Test description",
	}

	body, _ := json.Marshal(updateData)
	req := httptest.NewRequest("PUT", "/api/users/self/portfolio", bytes.NewBuffer(body))
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
	router.With(mockMiddleware).Put("/api/users/self/portfolio", handlers.UpdateSelfPortfolio)
	router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusNotFound, w.Code)
}

func (suite *UserPortfolioTestSuite) TestUpdateSelfPortfolio_InvalidJSON() {
	_ = suite.createTestPsychologist() // Используем _ чтобы избежать "declared and not used"

	req := httptest.NewRequest("PUT", "/api/users/self/portfolio", bytes.NewBuffer([]byte("invalid json")))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusBadRequest, w.Code)
}

// ============== ТЕСТЫ ДЛЯ UploadPortfolioPhoto ==============

func (suite *UserPortfolioTestSuite) TestUploadPortfolioPhoto_Success() {
	user := suite.createTestPsychologist()
	_ = suite.createTestPortfolio(user.ID)

	// Создаем тестовый файл в памяти
	testImageData := []byte("fake image data for testing")

	// Создаем multipart форму
	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)

	// Создаем файловое поле
	part, err := writer.CreateFormFile("photo", "test.jpg")
	suite.Require().NoError(err)

	// Записываем тестовые данные
	_, err = part.Write(testImageData)
	suite.Require().NoError(err)

	// Закрываем writer
	err = writer.Close()
	suite.Require().NoError(err)

	req := httptest.NewRequest("POST", "/api/users/portfolio/photo", body)
	req.Header.Set("Content-Type", writer.FormDataContentType())
	w := httptest.NewRecorder()

	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusCreated, w.Code)

	var response map[string]interface{}
	err = json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), true, response["success"])
	assert.Equal(suite.T(), "Photo uploaded successfully", response["message"])
	assert.NotNil(suite.T(), response["data"])
}

func (suite *UserPortfolioTestSuite) TestUploadPortfolioPhoto_WithRealFile() {
	user := suite.createTestPsychologist()
	_ = suite.createTestPortfolio(user.ID)

	// Создаем реальный тестовый файл
	testFilePath := "./test_photo.jpg"
	testImageData := []byte("fake JPEG data for testing")
	err := os.WriteFile(testFilePath, testImageData, 0644)
	suite.Require().NoError(err)

	// Убираем файл после теста
	defer os.Remove(testFilePath)

	// Открываем файл
	file, err := os.Open(testFilePath)
	suite.Require().NoError(err)
	defer file.Close()

	// Создаем multipart форму
	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)

	// Создаем файловое поле
	part, err := writer.CreateFormFile("photo", filepath.Base(testFilePath))
	suite.Require().NoError(err)

	// Копируем содержимое файла
	_, err = io.Copy(part, file)
	suite.Require().NoError(err)

	// Закрываем writer
	err = writer.Close()
	suite.Require().NoError(err)

	req := httptest.NewRequest("POST", "/api/users/portfolio/photo", body)
	req.Header.Set("Content-Type", writer.FormDataContentType())
	w := httptest.NewRecorder()

	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusCreated, w.Code)

	var response map[string]interface{}
	err = json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), true, response["success"])
	assert.Equal(suite.T(), "Photo uploaded successfully", response["message"])
	assert.NotNil(suite.T(), response["data"])
}

func (suite *UserPortfolioTestSuite) TestUploadPortfolioPhoto_LargeFile() {
	user := suite.createTestPsychologist()
	_ = suite.createTestPortfolio(user.ID)

	// Создаем "большой" файл (симулируем)
	largeImageData := make([]byte, 1024*1024) // 1MB
	for i := range largeImageData {
		largeImageData[i] = byte(i % 256)
	}

	// Создаем multipart форму
	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)

	// Создаем файловое поле
	part, err := writer.CreateFormFile("photo", "large_test.jpg")
	suite.Require().NoError(err)

	// Записываем данные
	_, err = part.Write(largeImageData)
	suite.Require().NoError(err)

	// Закрываем writer
	err = writer.Close()
	suite.Require().NoError(err)

	req := httptest.NewRequest("POST", "/api/users/portfolio/photo", body)
	req.Header.Set("Content-Type", writer.FormDataContentType())
	w := httptest.NewRecorder()

	suite.router.ServeHTTP(w, req)

	// Проверяем что файл принят или отклонен по размеру
	assert.True(suite.T(), w.Code == http.StatusCreated || w.Code == http.StatusBadRequest)
}

func (suite *UserPortfolioTestSuite) TestUploadPortfolioPhoto_InvalidFileType() {
	user := suite.createTestPsychologist()
	_ = suite.createTestPortfolio(user.ID)

	// Создаем файл с неправильным типом
	textData := []byte("This is not an image file")

	// Создаем multipart форму
	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)

	// Создаем файловое поле с расширением .txt
	part, err := writer.CreateFormFile("photo", "test.txt")
	suite.Require().NoError(err)

	// Записываем текстовые данные
	_, err = part.Write(textData)
	suite.Require().NoError(err)

	// Закрываем writer
	err = writer.Close()
	suite.Require().NoError(err)

	req := httptest.NewRequest("POST", "/api/users/portfolio/photo", body)
	req.Header.Set("Content-Type", writer.FormDataContentType())
	w := httptest.NewRecorder()

	suite.router.ServeHTTP(w, req)

	// Ожидаем ошибку валидации типа файла
	assert.Equal(suite.T(), http.StatusBadRequest, w.Code)
}

func (suite *UserPortfolioTestSuite) TestUploadPortfolioPhoto_NoFile() {
	user := suite.createTestPsychologist()
	_ = suite.createTestPortfolio(user.ID)

	// Создаем multipart форму без файла
	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)

	// Добавляем только текстовое поле
	err := writer.WriteField("description", "test description")
	suite.Require().NoError(err)

	// Закрываем writer
	err = writer.Close()
	suite.Require().NoError(err)

	req := httptest.NewRequest("POST", "/api/users/portfolio/photo", body)
	req.Header.Set("Content-Type", writer.FormDataContentType())
	w := httptest.NewRecorder()

	suite.router.ServeHTTP(w, req)

	// Ожидаем ошибку "файл не найден"
	assert.Equal(suite.T(), http.StatusBadRequest, w.Code)
}

func (suite *UserPortfolioTestSuite) createTestImageFile(filename string) string {
	// Создаем простой тестовый файл изображения
	testFilePath := filepath.Join("./uploads/portfolio", filename)
	testImageData := []byte("fake image data for testing")

	err := os.WriteFile(testFilePath, testImageData, 0644)
	suite.Require().NoError(err)

	return testFilePath
}

// ============== ТЕСТЫ ДЛЯ DeletePortfolioPhoto ==============

func (suite *UserPortfolioTestSuite) TestDeletePortfolioPhoto_Success() {
	user := suite.createTestPsychologist()
	portfolio := suite.createTestPortfolio(user.ID)
	photo := suite.createTestPhoto(portfolio.ID)

	// Создаем тестовый файл
	testFilePath := "./uploads/portfolio/test.jpg"
	err := os.WriteFile(testFilePath, []byte("test image data"), 0644)
	suite.Require().NoError(err)

	req := httptest.NewRequest("DELETE", fmt.Sprintf("/api/users/portfolio/photo/%d", photo.ID), nil)
	w := httptest.NewRecorder()

	// Добавляем параметр в контекст
	rctx := chi.NewRouteContext()
	rctx.URLParams.Add("photo_id", strconv.FormatUint(photo.ID, 10))
	req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, rctx))

	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusOK, w.Code)

	var response map[string]interface{}
	err = json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), true, response["success"])
	assert.Equal(suite.T(), "Photo deleted successfully", response["message"])

	// Проверяем, что фото удалено из БД
	var deletedPhoto models.Photo
	err = suite.db.First(&deletedPhoto, photo.ID).Error
	assert.Error(suite.T(), err) // Должна быть ошибка "record not found"

	// Проверяем, что файл удален
	_, err = os.Stat(testFilePath)
	assert.True(suite.T(), os.IsNotExist(err))
}

func (suite *UserPortfolioTestSuite) TestDeletePortfolioPhoto_PhotoNotFound() {
	_ = suite.createTestPsychologist() // Используем _ чтобы избежать "declared and not used"

	req := httptest.NewRequest("DELETE", "/api/users/portfolio/photo/999", nil)
	w := httptest.NewRecorder()

	// Добавляем параметр в контекст
	rctx := chi.NewRouteContext()
	rctx.URLParams.Add("photo_id", "999")
	req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, rctx))

	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusNotFound, w.Code)
}

func (suite *UserPortfolioTestSuite) TestDeletePortfolioPhoto_InvalidID() {
	_ = suite.createTestPsychologist() // Используем _ чтобы избежать "declared and not used"

	req := httptest.NewRequest("DELETE", "/api/users/portfolio/photo/invalid", nil)
	w := httptest.NewRecorder()

	// Добавляем параметр в контекст
	rctx := chi.NewRouteContext()
	rctx.URLParams.Add("photo_id", "invalid")
	req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, rctx))

	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusBadRequest, w.Code)
}

func (suite *UserPortfolioTestSuite) TestDeletePortfolioPhoto_ClientForbidden() {
	_ = suite.createTestClient() // Используем _ чтобы избежать "declared and not used"

	req := httptest.NewRequest("DELETE", "/api/users/portfolio/photo/1", nil)
	w := httptest.NewRecorder()

	// Добавляем параметр в контекст
	rctx := chi.NewRouteContext()
	rctx.URLParams.Add("photo_id", "1")
	req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, rctx))

	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusForbidden, w.Code)
}

func (suite *UserPortfolioTestSuite) TestDeletePortfolioPhoto_Unauthorized() {
	req := httptest.NewRequest("DELETE", "/api/users/portfolio/photo/1", nil)
	w := httptest.NewRecorder()

	// Создаем middleware без email в контексте
	mockMiddleware := func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			next.ServeHTTP(w, r)
		})
	}

	router := chi.NewRouter()
	router.With(mockMiddleware).Delete("/api/users/portfolio/photo/{photo_id}", handlers.DeletePortfolioPhoto)

	// Добавляем параметр в контекст
	rctx := chi.NewRouteContext()
	rctx.URLParams.Add("photo_id", "1")
	req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, rctx))

	router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusUnauthorized, w.Code)
}

func (suite *UserPortfolioTestSuite) TestDeletePortfolioPhoto_UserNotFound() {
	req := httptest.NewRequest("DELETE", "/api/users/portfolio/photo/1", nil)
	w := httptest.NewRecorder()

	// Используем middleware с email, который не существует в БД
	mockMiddleware := func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			ctx := context.WithValue(r.Context(), "email", "nonexistent@example.com")
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}

	router := chi.NewRouter()
	router.With(mockMiddleware).Delete("/api/users/portfolio/photo/{photo_id}", handlers.DeletePortfolioPhoto)

	// Добавляем параметр в контекст
	rctx := chi.NewRouteContext()
	rctx.URLParams.Add("photo_id", "1")
	req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, rctx))

	router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusNotFound, w.Code)
}

func (suite *UserPortfolioTestSuite) TestDeletePortfolioPhoto_AccessDenied() {
	user1 := suite.createTestPsychologist()
	portfolio1 := suite.createTestPortfolio(user1.ID)
	photo1 := suite.createTestPhoto(portfolio1.ID)

	// Создаем второго пользователя
	user2 := &models.User{
		FirstName: "Another",
		LastName:  "User",
		Email:     "test@example.com", // Тот же email для middleware
		Password:  "hashedpassword",
		Role:      "psychologist",
		Status:    "Active",
		Verified:  true,
	}
	err := suite.db.Create(user2).Error
	suite.Require().NoError(err)

	// Пытаемся удалить фото другого пользователя
	req := httptest.NewRequest("DELETE", fmt.Sprintf("/api/users/portfolio/photo/%d", photo1.ID), nil)
	w := httptest.NewRecorder()

	// Добавляем параметр в контекст
	rctx := chi.NewRouteContext()
	rctx.URLParams.Add("photo_id", strconv.FormatUint(photo1.ID, 10))
	req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, rctx))

	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusNotFound, w.Code)
}

func (suite *UserPortfolioTestSuite) TearDown() {
	// Очищаем тестовые файлы
	os.RemoveAll("./uploads/portfolio")
}

func (suite *UserPortfolioTestSuite) TearDownSuite() {
	// Очистка после всех тестов
	suite.TearDown()
	sqlDB, err := suite.db.DB()
	if err == nil {
		sqlDB.Close()
	}
}

func TestUserPortfolioTestSuite(t *testing.T) {
	suite.Run(t, new(UserPortfolioTestSuite))
}
