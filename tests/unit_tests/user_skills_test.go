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

type UserSkillsTestSuite struct {
	suite.Suite
	db     *gorm.DB
	router *chi.Mux
}

func (suite *UserSkillsTestSuite) SetupSuite() {
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
		&models.Category{},
		&models.Skill{},
		&models.PsychologistSkills{},
	)
	suite.Require().NoError(err)

	suite.router = chi.NewRouter()
	suite.setupRoutes()
}

func (suite *UserSkillsTestSuite) SetupTest() {
	suite.db.Exec("SET FOREIGN_KEY_CHECKS = 0")
	tables := []string{"users", "categories", "skills", "psychologist_skills"}
	for _, table := range tables {
		suite.db.Exec("TRUNCATE TABLE " + table)
	}
	suite.db.Exec("SET FOREIGN_KEY_CHECKS = 1")
}

func (suite *UserSkillsTestSuite) setupRoutes() {
	suite.router.Route("/api/users", func(r chi.Router) {
		r.With(suite.mockUserMiddleware).Put("/self/skills", handlers.SetSpecialistSkills)
		r.Get("/skills", handlers.GetAllSkillsByCategory)
		r.Get("/{user_id}/skills", handlers.GetUserSkills)
	})
}

func (suite *UserSkillsTestSuite) mockUserMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ctx := context.WithValue(r.Context(), "email", "psychologist@example.com")
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func (suite *UserSkillsTestSuite) createTestPsychologist(email string) *models.User {
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

func (suite *UserSkillsTestSuite) createTestCategory(name string) *models.Category {
	category := &models.Category{Name: name}
	err := suite.db.Create(category).Error
	suite.Require().NoError(err)
	return category
}

func (suite *UserSkillsTestSuite) createTestSkill(name string, categoryID uint64) *models.Skill {
	skill := &models.Skill{Name: name, CategoryID: categoryID}
	err := suite.db.Create(skill).Error
	suite.Require().NoError(err)
	return skill
}

// ============== ТЕСТЫ ДЛЯ SetSpecialistSkills ==============

func (suite *UserSkillsTestSuite) TestSetSpecialistSkills_Success() {
	user := suite.createTestPsychologist("psychologist@example.com")
	category := suite.createTestCategory("Therapy")
	skill1 := suite.createTestSkill("CBT", category.ID)
	skill2 := suite.createTestSkill("DBT", category.ID)

	skillIDs := []uint64{skill1.ID, skill2.ID}
	body, _ := json.Marshal(skillIDs)
	req := httptest.NewRequest("PUT", "/api/users/self/skills", bytes.NewBuffer(body))
	w := httptest.NewRecorder()

	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusOK, w.Code)
	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	assert.True(suite.T(), response["success"].(bool))

	var count int64
	suite.db.Model(&models.PsychologistSkills{}).Where("psychologist_id = ?", user.ID).Count(&count)
	assert.Equal(suite.T(), int64(2), count)
}

func (suite *UserSkillsTestSuite) TestSetSpecialistSkills_ClientForbidden() {
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
	router.With(mockClientMiddleware).Put("/api/users/self/skills", handlers.SetSpecialistSkills)

	skillIDs := []uint64{1, 2}
	body, _ := json.Marshal(skillIDs)
	req := httptest.NewRequest("PUT", "/api/users/self/skills", bytes.NewBuffer(body))
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)
	assert.Equal(suite.T(), http.StatusForbidden, w.Code)
}

func (suite *UserSkillsTestSuite) TestSetSpecialistSkills_InvalidSkillID() {
	_ = suite.createTestPsychologist("psychologist@example.com")
	category := suite.createTestCategory("Therapy")
	skill1 := suite.createTestSkill("CBT", category.ID)

	skillIDs := []uint64{skill1.ID, 999} // 999 is an invalid ID
	body, _ := json.Marshal(skillIDs)
	req := httptest.NewRequest("PUT", "/api/users/self/skills", bytes.NewBuffer(body))
	w := httptest.NewRecorder()

	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusBadRequest, w.Code)
}

// ============== ТЕСТЫ ДЛЯ GetAllSkillsByCategory ==============

func (suite *UserSkillsTestSuite) TestGetAllSkillsByCategory_Success() {
	category1 := suite.createTestCategory("Category A")
	category2 := suite.createTestCategory("Category B")
	_ = suite.createTestSkill("Skill A1", category1.ID)
	_ = suite.createTestSkill("Skill B1", category2.ID)

	req := httptest.NewRequest("GET", "/api/users/skills", nil)
	w := httptest.NewRecorder()
	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusOK, w.Code)
	var response []map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	assert.Len(suite.T(), response, 2)
	assert.Equal(suite.T(), "Skill A1", response[0]["name"])
	assert.Equal(suite.T(), "Category A", response[0]["category"])
}

func (suite *UserSkillsTestSuite) TestGetAllSkillsByCategory_Empty() {
	req := httptest.NewRequest("GET", "/api/users/skills", nil)
	w := httptest.NewRecorder()
	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusOK, w.Code)

	var response []map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	suite.Require().NoError(err)
	assert.Len(suite.T(), response, 0)
}

// ============== ТЕСТЫ ДЛЯ GetUserSkills ==============

func (suite *UserSkillsTestSuite) TestGetUserSkills_Success() {
	user := suite.createTestPsychologist("psychologist@example.com")
	category := suite.createTestCategory("Therapy")
	skill := suite.createTestSkill("CBT", category.ID)
	suite.db.Model(user).Association("Skills").Append(skill)

	req := httptest.NewRequest("GET", fmt.Sprintf("/api/users/%d/skills", user.ID), nil)
	w := httptest.NewRecorder()

	// Need to add URL param to context for chi router
	rctx := chi.NewRouteContext()
	rctx.URLParams.Add("user_id", strconv.FormatUint(user.ID, 10))
	req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, rctx))

	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusOK, w.Code)
	var skills []models.Skill
	json.Unmarshal(w.Body.Bytes(), &skills)
	assert.Len(suite.T(), skills, 1)
	assert.Equal(suite.T(), "CBT", skills[0].Name)
}

func (suite *UserSkillsTestSuite) TestGetUserSkills_UserNotFound() {
	req := httptest.NewRequest("GET", "/api/users/999/skills", nil)
	w := httptest.NewRecorder()

	rctx := chi.NewRouteContext()
	rctx.URLParams.Add("user_id", "999")
	req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, rctx))

	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusNotFound, w.Code)
}

func (suite *UserSkillsTestSuite) TearDownSuite() {
	sqlDB, err := suite.db.DB()
	if err == nil {
		sqlDB.Close()
	}
}

func TestUserSkillsTestSuite(t *testing.T) {
	suite.Run(t, new(UserSkillsTestSuite))
}
