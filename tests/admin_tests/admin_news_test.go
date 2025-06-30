package admin_tests

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strconv"
	"testing"
	"user-api/internal/db"
	"user-api/internal/handlers"
	"user-api/internal/models"

	"github.com/go-chi/chi/v5"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/suite"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

type AdminNewsTestSuite struct {
	suite.Suite
	db     *gorm.DB
	router *chi.Mux
	admin  *models.Administrator
}

func (suite *AdminNewsTestSuite) SetupSuite() {
	// Створюємо тестову базу даних в пам'яті
	testDB, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	suite.Require().NoError(err)

	suite.db = testDB
	db.DB = testDB

	// Міграція моделей
	err = testDB.AutoMigrate(
		&models.Administrator{},
		&models.News{},
	)
	suite.Require().NoError(err)

	// Створюємо роутер
	suite.router = chi.NewRouter()
	suite.setupRoutes()
}

func (suite *AdminNewsTestSuite) SetupTest() {
	// Очищаємо базу даних перед кожним тестом
	suite.db.Exec("DELETE FROM news")
	suite.db.Exec("DELETE FROM administrators")

	// Створюємо тестового адміністратора
	suite.admin = &models.Administrator{
		ID:        1,
		FirstName: "Test",
		LastName:  "Admin",
		Email:     "test@admin.com",
		Role:      "admin",
		Status:    "active",
		Password:  "hashed_password",
	}
	suite.db.Create(suite.admin)
}

func (suite *AdminNewsTestSuite) setupRoutes() {
	suite.router.Route("/api/admin", func(r chi.Router) {
		r.Use(suite.mockAdminMiddleware)
		r.Post("/news", handlers.CreateNews)
		r.Get("/news", handlers.GetAllNews)
		r.Get("/news/{id}", handlers.GetNews)
		r.Put("/news/{id}", handlers.UpdateNews)
		r.Delete("/news/{id}", handlers.DeleteNews)
		r.Patch("/news/{id}/publish", handlers.PublishNews)
	})
}

func (suite *AdminNewsTestSuite) mockAdminMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ctx := context.WithValue(r.Context(), "admin", suite.admin)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func (suite *AdminNewsTestSuite) TearDownSuite() {
	sqlDB, _ := suite.db.DB()
	sqlDB.Close()
}

func (suite *AdminNewsTestSuite) TestCreateNews_Success() {
	newsData := map[string]interface{}{
		"title":     "Test News",
		"content":   "<p>Test content</p>",
		"summary":   "Test summary",
		"imageUrl":  "https://example.com/image.jpg",
		"isPublic":  true,
		"published": false,
	}

	body, _ := json.Marshal(newsData)
	req := httptest.NewRequest("POST", "/api/admin/news", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusCreated, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(suite.T(), err)
	assert.True(suite.T(), response["success"].(bool))

	// Перевіряємо, що новина створена в БД
	var news models.News
	err = suite.db.Where("title = ?", "Test News").First(&news).Error
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), "Test News", news.Title)
	assert.Equal(suite.T(), suite.admin.ID, news.AuthorID)
}

func (suite *AdminNewsTestSuite) TestCreateNews_MissingRequiredFields() {
	newsData := map[string]interface{}{
		"title":   "", // Порожній заголовок
		"content": "<p>Test content</p>",
	}

	body, _ := json.Marshal(newsData)
	req := httptest.NewRequest("POST", "/api/admin/news", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusBadRequest, w.Code)
}

func (suite *AdminNewsTestSuite) TestGetAllNews_Success() {
	// Створюємо тестову новину
	news := &models.News{
		Title:     "Test News",
		Content:   "Test content",
		Summary:   "Test summary",
		IsPublic:  true,
		Published: true,
		AuthorID:  suite.admin.ID,
	}
	suite.db.Create(news)

	req := httptest.NewRequest("GET", "/api/admin/news", nil)
	w := httptest.NewRecorder()

	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusOK, w.Code)

	var newsArray []models.News
	err := json.Unmarshal(w.Body.Bytes(), &newsArray)
	assert.NoError(suite.T(), err)
	assert.Len(suite.T(), newsArray, 1)
	assert.Equal(suite.T(), "Test News", newsArray[0].Title)
}

func (suite *AdminNewsTestSuite) TestUpdateNews_Success() {
	// Створюємо новину
	news := &models.News{
		Title:     "Original Title",
		Content:   "Original content",
		IsPublic:  true,
		Published: false,
		AuthorID:  suite.admin.ID,
	}
	suite.db.Create(news)

	updateData := map[string]interface{}{
		"title":     "Updated Title",
		"content":   "Updated content",
		"isPublic":  false,
		"published": true,
	}

	body, _ := json.Marshal(updateData)
	req := httptest.NewRequest("PUT", "/api/admin/news/"+strconv.Itoa(int(news.ID)), bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusOK, w.Code)

	// Перевіряємо оновлення в БД
	var updatedNews models.News
	suite.db.First(&updatedNews, news.ID)
	assert.Equal(suite.T(), "Updated Title", updatedNews.Title)
	assert.Equal(suite.T(), "Updated content", updatedNews.Content)
	assert.False(suite.T(), updatedNews.IsPublic)
	assert.True(suite.T(), updatedNews.Published)
}

func (suite *AdminNewsTestSuite) TestDeleteNews_Success() {
	// Створюємо новину
	news := &models.News{
		Title:    "To Delete",
		Content:  "Content to delete",
		AuthorID: suite.admin.ID,
	}
	suite.db.Create(news)

	req := httptest.NewRequest("DELETE", "/api/admin/news/"+strconv.Itoa(int(news.ID)), nil)
	w := httptest.NewRecorder()

	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusOK, w.Code)

	// Перевіряємо видалення (soft delete)
	var deletedNews models.News
	err := suite.db.Unscoped().First(&deletedNews, news.ID).Error
	assert.NoError(suite.T(), err)
	assert.NotNil(suite.T(), deletedNews.DeletedAt)
}

func (suite *AdminNewsTestSuite) TestDeleteNews_Forbidden() {
	// Створюємо іншого адміністратора
	otherAdmin := &models.Administrator{
		ID:        2,
		FirstName: "Other",
		LastName:  "Admin",
		Email:     "other@admin.com",
		Role:      "moderator",
		Status:    "active",
	}
	suite.db.Create(otherAdmin)

	// Створюємо новину від іншого адміністратора
	news := &models.News{
		Title:    "Other's News",
		Content:  "Content from other admin",
		AuthorID: otherAdmin.ID,
	}
	suite.db.Create(news)

	// Намагаємося видалити як звичайний адмін (не автор)
	req := httptest.NewRequest("DELETE", "/api/admin/news/"+strconv.Itoa(int(news.ID)), nil)
	w := httptest.NewRecorder()

	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusForbidden, w.Code)
}

func (suite *AdminNewsTestSuite) TestPublishNews_Success() {
	// Створюємо неопубліковану новину
	news := &models.News{
		Title:     "To Publish",
		Content:   "Content to publish",
		Published: false,
		AuthorID:  suite.admin.ID,
	}
	suite.db.Create(news)

	req := httptest.NewRequest("PATCH", "/api/admin/news/"+strconv.Itoa(int(news.ID))+"/publish?action=publish", nil)
	w := httptest.NewRecorder()

	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusOK, w.Code)

	// Перевіряємо, що новина опублікована
	var publishedNews models.News
	suite.db.First(&publishedNews, news.ID)
	assert.True(suite.T(), publishedNews.Published)
}

func (suite *AdminNewsTestSuite) TestPublishNews_InvalidAction() {
	news := &models.News{
		Title:    "Test News",
		Content:  "Test content",
		AuthorID: suite.admin.ID,
	}
	suite.db.Create(news)

	req := httptest.NewRequest("PATCH", "/api/admin/news/"+strconv.Itoa(int(news.ID))+"/publish?action=invalid", nil)
	w := httptest.NewRecorder()

	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusBadRequest, w.Code)
}

// Запуск тестів для новин
func TestAdminNewsTestSuite(t *testing.T) {
	suite.Run(t, new(AdminNewsTestSuite))
}
