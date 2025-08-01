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

type UserSessionsTestSuite struct {
	suite.Suite
	db     *gorm.DB
	router *chi.Mux
}

// SetupSuite runs once before all tests in the suite
func (suite *UserSessionsTestSuite) SetupSuite() {
	// Database connection
	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?charset=utf8mb4&parseTime=True&loc=Local",
		getEnv("DB_USER", "testuser"),
		getEnv("DB_PASSWORD", "testpass"),
		getEnv("DB_HOST", "localhost"),
		"3306",
		getEnv("DB_NAME", "testdb"),
	)
	testDB, err := gorm.Open(mysql.Open(dsn), &gorm.Config{})
	suite.Require().NoError(err)
	suite.db = testDB
	db.DB = testDB // Set global DB for handlers

	// Auto-migrate models
	err = testDB.AutoMigrate(&models.User{}, &models.Availability{}, &models.Session{})
	suite.Require().NoError(err)

	// Setup router
	suite.router = chi.NewRouter()
	suite.setupRoutes()
}

// TearDownSuite runs once after all tests in the suite
func (suite *UserSessionsTestSuite) TearDownSuite() {
	sqlDB, _ := suite.db.DB()
	sqlDB.Close()
}

// SetupTest runs before each test
func (suite *UserSessionsTestSuite) SetupTest() {
	suite.db.Exec("SET FOREIGN_KEY_CHECKS = 0")
	suite.db.Exec("TRUNCATE TABLE sessions")
	suite.db.Exec("TRUNCATE TABLE availability")
	suite.db.Exec("TRUNCATE TABLE users")
	suite.db.Exec("SET FOREIGN_KEY_CHECKS = 1")
}

// mockUserMiddleware creates a middleware to simulate an authenticated user
func (suite *UserSessionsTestSuite) mockUserMiddleware(user *models.User) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			ctx := context.WithValue(r.Context(), "user", user)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// setupRoutes configures the routes for the test suite
func (suite *UserSessionsTestSuite) setupRoutes() {
	// Public route
	suite.router.Get("/api/users/availability/{psychologistId}", handlers.GetPsychologistAvailability)

	// Protected routes (will be wrapped in mock middleware within tests)
	suite.router.Post("/api/users/availability", handlers.CreateAvailabilitySlot)
	suite.router.Delete("/api/users/availability/{slotId}", handlers.DeleteAvailabilitySlot)
	suite.router.Post("/api/users/sessions/book/{slotId}", handlers.BookSession)
	suite.router.Get("/api/users/sessions/my", handlers.GetMySessions)
}

// createTestUser is a helper to create users
func (suite *UserSessionsTestSuite) createTestUser(email, role string) *models.User {
	user := &models.User{
		Email:     email,
		Password:  "password",
		Role:      role,
		FirstName: "Test",
		LastName:  "User",
		Status:    "Active",
		Verified:  true,
	}
	err := suite.db.Create(user).Error
	suite.Require().NoError(err)
	return user
}

// createTestAvailability is a helper to create availability slots
func (suite *UserSessionsTestSuite) createTestAvailability(psychologistID uint64, startTime time.Time, status string) *models.Availability {
	availability := &models.Availability{
		PsychologistID: psychologistID,
		StartTime:      startTime,
		EndTime:        startTime.Add(time.Hour),
		Status:         status,
	}
	err := suite.db.Create(availability).Error
	suite.Require().NoError(err)
	return availability
}

// ============== TESTS FOR AVAILABILITY HANDLERS ==============

func (suite *UserSessionsTestSuite) TestCreateAvailabilitySlot_Success() {
	psychologist := suite.createTestUser("psycho@example.com", "psychologist")

	slotData := map[string]string{
		"startTime": time.Now().Add(24 * time.Hour).Format(time.RFC3339),
		"endTime":   time.Now().Add(25 * time.Hour).Format(time.RFC3339),
	}
	body, _ := json.Marshal(slotData)
	req := httptest.NewRequest("POST", "/api/users/availability", bytes.NewBuffer(body))
	w := httptest.NewRecorder()

	// Use middleware for the specific handler
	handler := suite.mockUserMiddleware(psychologist)(http.HandlerFunc(handlers.CreateAvailabilitySlot))
	handler.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusCreated, w.Code)
	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	assert.True(suite.T(), response["success"].(bool))

	// Check DB
	var availability models.Availability
	err := suite.db.First(&availability).Error
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), psychologist.ID, availability.PsychologistID)
}

func (suite *UserSessionsTestSuite) TestCreateAvailabilitySlot_ForbiddenForClient() {
	client := suite.createTestUser("client@example.com", "client")

	slotData := map[string]string{"startTime": "2025-12-01T10:00:00Z", "endTime": "2025-12-01T11:00:00Z"}
	body, _ := json.Marshal(slotData)
	req := httptest.NewRequest("POST", "/api/users/availability", bytes.NewBuffer(body))
	w := httptest.NewRecorder()

	handler := suite.mockUserMiddleware(client)(http.HandlerFunc(handlers.CreateAvailabilitySlot))
	handler.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusForbidden, w.Code)
}

func (suite *UserSessionsTestSuite) TestGetPsychologistAvailability_Success() {
	psychologist := suite.createTestUser("psycho@example.com", "psychologist")
	suite.createTestAvailability(psychologist.ID, time.Now().Add(2*time.Hour), "available")
	suite.createTestAvailability(psychologist.ID, time.Now().Add(4*time.Hour), "available")
	suite.createTestAvailability(psychologist.ID, time.Now().Add(6*time.Hour), "booked") // Should not be returned

	req := httptest.NewRequest("GET", fmt.Sprintf("/api/users/availability/%d", psychologist.ID), nil)
	w := httptest.NewRecorder()

	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusOK, w.Code)
	var response []models.Availability
	json.Unmarshal(w.Body.Bytes(), &response)
	assert.Len(suite.T(), response, 2)
}

func (suite *UserSessionsTestSuite) TestDeleteAvailabilitySlot_Success() {
	psychologist := suite.createTestUser("psycho@example.com", "psychologist")
	slot := suite.createTestAvailability(psychologist.ID, time.Now().Add(2*time.Hour), "available")

	req := httptest.NewRequest("DELETE", fmt.Sprintf("/api/users/availability/%d", slot.ID), nil)
	w := httptest.NewRecorder()

	// Add chi URL param
	rctx := chi.NewRouteContext()
	rctx.URLParams.Add("slotId", fmt.Sprintf("%d", slot.ID))
	req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, rctx))

	handler := suite.mockUserMiddleware(psychologist)(http.HandlerFunc(handlers.DeleteAvailabilitySlot))
	handler.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusOK, w.Code)

	// Verify deletion from DB
	var count int64
	suite.db.Model(&models.Availability{}).Where("id = ?", slot.ID).Count(&count)
	assert.Equal(suite.T(), int64(0), count)
}

// ============== TESTS FOR SESSION HANDLERS ==============

func (suite *UserSessionsTestSuite) TestBookSession_Success() {
	psychologist := suite.createTestUser("psycho@example.com", "psychologist")
	client := suite.createTestUser("client@example.com", "client")
	slot := suite.createTestAvailability(psychologist.ID, time.Now().Add(2*time.Hour), "available")

	req := httptest.NewRequest("POST", fmt.Sprintf("/api/users/sessions/book/%d", slot.ID), nil)
	w := httptest.NewRecorder()

	rctx := chi.NewRouteContext()
	rctx.URLParams.Add("slotId", fmt.Sprintf("%d", slot.ID))
	req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, rctx))

	handler := suite.mockUserMiddleware(client)(http.HandlerFunc(handlers.BookSession))
	handler.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusCreated, w.Code)

	// Check session in DB
	var session models.Session
	err := suite.db.First(&session).Error
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), client.ID, session.ClientID)
	assert.Equal(suite.T(), psychologist.ID, session.PsychologistID)

	// Check availability status updated
	var updatedSlot models.Availability
	suite.db.First(&updatedSlot, slot.ID)
	assert.Equal(suite.T(), "booked", updatedSlot.Status)
}

func (suite *UserSessionsTestSuite) TestBookSession_SlotNotFoundOrBooked() {
	client := suite.createTestUser("client@example.com", "client")

	req := httptest.NewRequest("POST", "/api/users/sessions/book/999", nil)
	w := httptest.NewRecorder()

	rctx := chi.NewRouteContext()
	rctx.URLParams.Add("slotId", "999")
	req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, rctx))

	handler := suite.mockUserMiddleware(client)(http.HandlerFunc(handlers.BookSession))
	handler.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusNotFound, w.Code)
}

func (suite *UserSessionsTestSuite) TestBookSession_ForbiddenForPsychologist() {
	psychologist := suite.createTestUser("psycho@example.com", "psychologist")
	slot := suite.createTestAvailability(psychologist.ID, time.Now().Add(2*time.Hour), "available")

	req := httptest.NewRequest("POST", fmt.Sprintf("/api/users/sessions/book/%d", slot.ID), nil)
	w := httptest.NewRecorder()

	rctx := chi.NewRouteContext()
	rctx.URLParams.Add("slotId", fmt.Sprintf("%d", slot.ID))
	req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, rctx))

	handler := suite.mockUserMiddleware(psychologist)(http.HandlerFunc(handlers.BookSession))
	handler.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusForbidden, w.Code)
}

func (suite *UserSessionsTestSuite) TestGetMySessions_Client() {
	psychologist := suite.createTestUser("psycho@example.com", "psychologist")
	client := suite.createTestUser("client@example.com", "client")
	slot := suite.createTestAvailability(psychologist.ID, time.Now().Add(2*time.Hour), "available")

	// Create a session for the client
	session := models.Session{
		PsychologistID: psychologist.ID,
		ClientID:       client.ID,
		StartTime:      slot.StartTime,
		EndTime:        slot.EndTime,
		Status:         "confirmed",
	}
	suite.db.Create(&session)

	req := httptest.NewRequest("GET", "/api/users/sessions/my", nil)
	w := httptest.NewRecorder()

	handler := suite.mockUserMiddleware(client)(http.HandlerFunc(handlers.GetMySessions))
	handler.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusOK, w.Code)
	var response []models.Session
	json.Unmarshal(w.Body.Bytes(), &response)
	assert.Len(suite.T(), response, 1)
	assert.Equal(suite.T(), client.ID, response[0].ClientID)
}

func (suite *UserSessionsTestSuite) TestGetMySessions_Psychologist() {
	psychologist := suite.createTestUser("psycho@example.com", "psychologist")
	client := suite.createTestUser("client@example.com", "client")
	slot := suite.createTestAvailability(psychologist.ID, time.Now().Add(2*time.Hour), "available")

	// Create a session for the psychologist
	session := models.Session{
		PsychologistID: psychologist.ID,
		ClientID:       client.ID,
		StartTime:      slot.StartTime,
		EndTime:        slot.EndTime,
		Status:         "confirmed",
	}
	suite.db.Create(&session)

	req := httptest.NewRequest("GET", "/api/users/sessions/my", nil)
	w := httptest.NewRecorder()

	handler := suite.mockUserMiddleware(psychologist)(http.HandlerFunc(handlers.GetMySessions))
	handler.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusOK, w.Code)
	var response []models.Session
	json.Unmarshal(w.Body.Bytes(), &response)
	assert.Len(suite.T(), response, 1)
	assert.Equal(suite.T(), psychologist.ID, response[0].PsychologistID)
}

// Test runner
func TestUserSessionsTestSuite(t *testing.T) {
	suite.Run(t, new(UserSessionsTestSuite))
}

// getEnv is a helper to read environment variables
func getEnv(key, fallback string) string {
	if value, ok := os.LookupEnv(key); ok {
		return value
	}
	return fallback
}
