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
	"user-api/internal/db"
	"user-api/internal/handlers"
	"user-api/internal/models"

	"github.com/go-chi/chi/v5"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/suite"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

type UserReviewsTestSuite struct {
	suite.Suite
	db     *gorm.DB
	router *chi.Mux
}

func (suite *UserReviewsTestSuite) SetupSuite() {
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
		&models.Review{},
		&models.Rating{},
	)
	suite.Require().NoError(err)

	suite.router = chi.NewRouter()
	suite.setupRoutes()
}

func (suite *UserReviewsTestSuite) SetupTest() {
	suite.db.Exec("SET FOREIGN_KEY_CHECKS = 0")
	tables := []string{"users", "reviews", "ratings"}
	for _, table := range tables {
		suite.db.Exec("TRUNCATE TABLE " + table)
	}
	suite.db.Exec("SET FOREIGN_KEY_CHECKS = 1")
}

func (suite *UserReviewsTestSuite) setupRoutes() {
	suite.router.Route("/api/reviews", func(r chi.Router) {
		r.With(suite.mockClientMiddleware).Post("/{psychologist_id}", handlers.CreateReview)
	})
}

func (suite *UserReviewsTestSuite) mockClientMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ctx := context.WithValue(r.Context(), "email", "client@example.com")
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func (suite *UserReviewsTestSuite) createTestUser(email, role string) *models.User {
	user := &models.User{
		FirstName: "Test",
		LastName:  "User",
		Email:     email,
		Password:  "password",
		Role:      role,
		Status:    "Active",
		Verified:  true,
	}
	err := suite.db.Create(user).Error
	suite.Require().NoError(err)
	return user
}

// ============== ТЕСТЫ ДЛЯ CreateReview ==============

func (suite *UserReviewsTestSuite) TestCreateReview_Success() {
	_ = suite.createTestUser("client@example.com", "client")
	psychologist := suite.createTestUser("psychologist@example.com", "psychologist")

	reviewData := map[string]interface{}{
		"rating":  5,
		"comment": "Excellent session!",
	}
	body, _ := json.Marshal(reviewData)
	req := httptest.NewRequest("POST", fmt.Sprintf("/api/reviews/%d", psychologist.ID), bytes.NewBuffer(body))
	w := httptest.NewRecorder()

	rctx := chi.NewRouteContext()
	rctx.URLParams.Add("psychologist_id", strconv.FormatUint(psychologist.ID, 10))
	req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, rctx))

	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusCreated, w.Code)

	// Проверяем, что отзыв создан в БД
	var review models.Review
	err := suite.db.Where("psychologist_id = ?", psychologist.ID).First(&review).Error
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), 5, review.Rating)
	assert.Equal(suite.T(), "Excellent session!", *review.Comment)

	// Проверяем, что рейтинг обновлен
	var rating models.Rating
	err = suite.db.Where("psychologist_id = ?", psychologist.ID).First(&rating).Error
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), 5.0, rating.AverageRating)
	assert.Equal(suite.T(), 1, rating.ReviewCount)
}

func (suite *UserReviewsTestSuite) TestCreateReview_PsychologistNotFound() {
	_ = suite.createTestUser("client@example.com", "client")

	reviewData := map[string]interface{}{"rating": 5}
	body, _ := json.Marshal(reviewData)
	req := httptest.NewRequest("POST", "/api/reviews/999", bytes.NewBuffer(body))
	w := httptest.NewRecorder()

	rctx := chi.NewRouteContext()
	rctx.URLParams.Add("psychologist_id", "999")
	req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, rctx))

	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusNotFound, w.Code)
}

func (suite *UserReviewsTestSuite) TestCreateReview_ForbiddenForPsychologist() {
	// Создаем психолога, который будет пытаться оставить отзыв
	_ = suite.createTestUser("psychologist@example.com", "psychologist")
	anotherPsychologist := suite.createTestUser("another@example.com", "psychologist")

	// Создаем новый роутер с middleware для психолога
	router := chi.NewRouter()
	mockPsychologistMiddleware := func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			ctx := context.WithValue(r.Context(), "email", "psychologist@example.com")
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
	router.With(mockPsychologistMiddleware).Post("/api/reviews/{psychologist_id}", handlers.CreateReview)

	reviewData := map[string]interface{}{"rating": 5}
	body, _ := json.Marshal(reviewData)
	req := httptest.NewRequest("POST", fmt.Sprintf("/api/reviews/%d", anotherPsychologist.ID), bytes.NewBuffer(body))
	w := httptest.NewRecorder()

	rctx := chi.NewRouteContext()
	rctx.URLParams.Add("psychologist_id", strconv.FormatUint(anotherPsychologist.ID, 10))
	req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, rctx))

	router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusForbidden, w.Code)
}

func (suite *UserReviewsTestSuite) TestCreateReview_AlreadyReviewed() {
	client := suite.createTestUser("client@example.com", "client")
	psychologist := suite.createTestUser("psychologist@example.com", "psychologist")

	// Создаем первый отзыв
	firstReview := models.Review{
		ClientID:       client.ID,
		PsychologistID: psychologist.ID,
		Rating:         4,
	}
	suite.db.Create(&firstReview)

	// Пытаемся создать второй отзыв
	reviewData := map[string]interface{}{"rating": 5}
	body, _ := json.Marshal(reviewData)
	req := httptest.NewRequest("POST", fmt.Sprintf("/api/reviews/%d", psychologist.ID), bytes.NewBuffer(body))
	w := httptest.NewRecorder()

	rctx := chi.NewRouteContext()
	rctx.URLParams.Add("psychologist_id", strconv.FormatUint(psychologist.ID, 10))
	req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, rctx))

	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusBadRequest, w.Code)
}

func (suite *UserReviewsTestSuite) TestCreateReview_InvalidRating() {
	_ = suite.createTestUser("client@example.com", "client")
	psychologist := suite.createTestUser("psychologist@example.com", "psychologist")

	reviewData := map[string]interface{}{"rating": 6} // Невалидный рейтинг
	body, _ := json.Marshal(reviewData)
	req := httptest.NewRequest("POST", fmt.Sprintf("/api/reviews/%d", psychologist.ID), bytes.NewBuffer(body))
	w := httptest.NewRecorder()

	rctx := chi.NewRouteContext()
	rctx.URLParams.Add("psychologist_id", strconv.FormatUint(psychologist.ID, 10))
	req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, rctx))

	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusBadRequest, w.Code)
}

func (suite *UserReviewsTestSuite) TearDownSuite() {
	sqlDB, err := suite.db.DB()
	if err == nil {
		sqlDB.Close()
	}
}

func TestUserReviewsTestSuite(t *testing.T) {
	suite.Run(t, new(UserReviewsTestSuite))
}
