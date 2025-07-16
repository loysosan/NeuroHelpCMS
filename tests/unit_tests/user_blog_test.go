package unit_tests

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
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

type UserBlogTestSuite struct {
	suite.Suite
	db     *gorm.DB
	router *chi.Mux
}

func (suite *UserBlogTestSuite) SetupSuite() {
	dbHost := os.Getenv("DB_HOST")
	if dbHost == "" {
		dbHost = "localhost"
	}
	dsn := fmt.Sprintf("testuser:testpass@tcp(%s:3306)/testdb?charset=utf8mb4&parseTime=True&loc=Local", dbHost)
	testDB, err := gorm.Open(mysql.Open(dsn), &gorm.Config{})
	suite.Require().NoError(err)

	suite.db = testDB
	db.DB = testDB

	err = testDB.AutoMigrate(
		&models.User{},
		&models.Portfolio{},
		&models.Photo{},
		&models.Skill{},
		&models.Category{},
		&models.Rating{},
		&models.Review{},
		&models.BlogPost{},
	)
	suite.Require().NoError(err)

	suite.router = chi.NewRouter()
	suite.setupRoutes()
}

func (suite *UserBlogTestSuite) SetupTest() {
	suite.db.Exec("SET FOREIGN_KEY_CHECKS = 0")
	tables := []string{"users", "portfolios", "photos", "skills", "categories", "ratings", "reviews", "blog_posts"}
	for _, table := range tables {
		suite.db.Exec("TRUNCATE TABLE " + table)
	}
	suite.db.Exec("SET FOREIGN_KEY_CHECKS = 1")
}

func (suite *UserBlogTestSuite) setupRoutes() {
	suite.router.Route("/api/users/blog", func(r chi.Router) {
		r.With(suite.mockUserMiddleware).Post("/", handlers.CreateBlogPost)
		r.Get("/{psychologist_id}", handlers.GetBlogPosts)
		r.Get("/post/{blog_id}", handlers.GetBlogPost)
		r.With(suite.mockUserMiddleware).Put("/post/{blog_id}", handlers.UpdateBlogPost)
		r.With(suite.mockUserMiddleware).Delete("/post/{blog_id}", handlers.DeleteBlogPost)
	})
}

func (suite *UserBlogTestSuite) mockUserMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ctx := context.WithValue(r.Context(), "email", "psychologist@example.com")
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func (suite *UserBlogTestSuite) createTestPsychologist(email string) *models.User {
	user := &models.User{
		FirstName: "Test",
		LastName:  "Psychologist",
		Email:     email,
		Password:  "hashedpassword",
		Role:      "psychologist",
		Status:    "Active",
		Verified:  true,
	}
	err := suite.db.Create(user).Error
	suite.Require().NoError(err)
	return user
}

func (suite *UserBlogTestSuite) createTestBlogPost(psychologistID uint64, title string) *models.BlogPost {
	post := &models.BlogPost{
		PsychologistID: psychologistID,
		Title:          title,
		Content:        "This is the content of the blog post.",
		Visible:        "public",
	}
	err := suite.db.Create(post).Error
	suite.Require().NoError(err)
	return post
}

// ============== ТЕСТЫ ДЛЯ CreateBlogPost ==============

func (suite *UserBlogTestSuite) TestCreateBlogPost_Success() {
	_ = suite.createTestPsychologist("psychologist@example.com")

	postData := map[string]string{
		"title":   "New Blog Post",
		"content": "Content of the new post.",
	}
	body, _ := json.Marshal(postData)
	req := httptest.NewRequest("POST", "/api/users/blog/", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusCreated, w.Code)
	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	assert.True(suite.T(), response["success"].(bool))
	assert.Equal(suite.T(), "Blog post created successfully", response["message"])
}

func (suite *UserBlogTestSuite) TestCreateBlogPost_Forbidden() {
	// Create a client user
	client := &models.User{Email: "client@example.com", Role: "client", Status: "Active", Verified: true}
	suite.db.Create(client)

	// Create a new router and middleware for this specific test
	router := chi.NewRouter()
	mockClientMiddleware := func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			ctx := context.WithValue(r.Context(), "email", "client@example.com")
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
	router.With(mockClientMiddleware).Post("/api/users/blog/", handlers.CreateBlogPost)

	postData := map[string]string{"title": "Test", "content": "Test"}
	body, _ := json.Marshal(postData)
	req := httptest.NewRequest("POST", "/api/users/blog/", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)
	assert.Equal(suite.T(), http.StatusForbidden, w.Code)
}

// ============== ТЕСТЫ ДЛЯ GetBlogPosts ==============

func (suite *UserBlogTestSuite) TestGetBlogPosts_Success() {
	psycho := suite.createTestPsychologist("psychologist@example.com")
	_ = suite.createTestBlogPost(psycho.ID, "Post 1")
	_ = suite.createTestBlogPost(psycho.ID, "Post 2")

	req := httptest.NewRequest("GET", fmt.Sprintf("/api/users/blog/%d", psycho.ID), nil)
	w := httptest.NewRecorder()

	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusOK, w.Code)
	var posts []models.BlogPost
	json.Unmarshal(w.Body.Bytes(), &posts)
	assert.Len(suite.T(), posts, 2)
}

func (suite *UserBlogTestSuite) TestGetBlogPosts_NotFound() {
	req := httptest.NewRequest("GET", "/api/users/blog/999", nil)
	w := httptest.NewRecorder()
	suite.router.ServeHTTP(w, req)
	assert.Equal(suite.T(), http.StatusNotFound, w.Code)
}

// ============== ТЕСТЫ ДЛЯ GetBlogPost ==============

func (suite *UserBlogTestSuite) TestGetBlogPost_Success() {
	psycho := suite.createTestPsychologist("psychologist@example.com")
	post := suite.createTestBlogPost(psycho.ID, "My Post")

	req := httptest.NewRequest("GET", fmt.Sprintf("/api/users/blog/post/%d", post.ID), nil)
	w := httptest.NewRecorder()
	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusOK, w.Code)
	var foundPost models.BlogPost
	json.Unmarshal(w.Body.Bytes(), &foundPost)
	assert.Equal(suite.T(), "My Post", foundPost.Title)
}

// ============== ТЕСТЫ ДЛЯ UpdateBlogPost ==============

func (suite *UserBlogTestSuite) TestUpdateBlogPost_Success() {
	psycho := suite.createTestPsychologist("psychologist@example.com")
	post := suite.createTestBlogPost(psycho.ID, "Original Title")

	updateData := map[string]string{
		"title":   "Updated Title",
		"content": "Updated content.",
	}
	body, _ := json.Marshal(updateData)
	req := httptest.NewRequest("PUT", fmt.Sprintf("/api/users/blog/post/%d", post.ID), bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusOK, w.Code)
	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	assert.True(suite.T(), response["success"].(bool))
	data := response["data"].(map[string]interface{})
	assert.Equal(suite.T(), "Updated Title", data["Title"])
}

func (suite *UserBlogTestSuite) TestUpdateBlogPost_AccessDenied() {
	psycho1 := suite.createTestPsychologist("psychologist@example.com")
	_ = suite.createTestBlogPost(psycho1.ID, "Psycho1 Post")

	psycho2 := suite.createTestPsychologist("another@example.com")
	post2 := suite.createTestBlogPost(psycho2.ID, "Psycho2 Post")

	updateData := map[string]string{"title": "Hacked"}
	body, _ := json.Marshal(updateData)
	// psycho1 tries to update psycho2's post
	req := httptest.NewRequest("PUT", fmt.Sprintf("/api/users/blog/post/%d", post2.ID), bytes.NewBuffer(body))
	w := httptest.NewRecorder()

	suite.router.ServeHTTP(w, req)
	assert.Equal(suite.T(), http.StatusNotFound, w.Code) // Not found or access denied
}

// ============== ТЕСТЫ ДЛЯ DeleteBlogPost ==============

func (suite *UserBlogTestSuite) TestDeleteBlogPost_Success() {
	psycho := suite.createTestPsychologist("psychologist@example.com")
	post := suite.createTestBlogPost(psycho.ID, "To Be Deleted")

	req := httptest.NewRequest("DELETE", fmt.Sprintf("/api/users/blog/post/%d", post.ID), nil)
	w := httptest.NewRecorder()

	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusOK, w.Code)
	var deletedPost models.BlogPost
	err := suite.db.First(&deletedPost, post.ID).Error
	assert.Error(suite.T(), err) // Should be "record not found"
}

func (suite *UserBlogTestSuite) TearDownSuite() {
	sqlDB, err := suite.db.DB()
	if err == nil {
		sqlDB.Close()
	}
}

func TestUserBlogTestSuite(t *testing.T) {
	suite.Run(t, new(UserBlogTestSuite))
}
