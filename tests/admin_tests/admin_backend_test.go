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

type AdminBackendTestSuite struct {
	suite.Suite
	db     *gorm.DB
	router *chi.Mux
	admin  *models.Administrator
	user   *models.User
}

func (suite *AdminBackendTestSuite) SetupSuite() {
	// Створюємо тестову базу даних в пам'яті
	testDB, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	suite.Require().NoError(err)

	suite.db = testDB
	db.DB = testDB // Встановлюємо глобальну змінну для хендлерів

	// Міграція моделей
	err = testDB.AutoMigrate(
		&models.User{},
		&models.Administrator{},
		&models.Category{},
		&models.Skill{},
		&models.Plan{},
		&models.News{},
		&models.Portfolio{},
		&models.Photo{},
		&models.Review{},
		&models.Rating{},
		&models.BlogPost{},
	)
	suite.Require().NoError(err)

	// Створюємо роутер
	suite.router = chi.NewRouter()
	suite.setupRoutes()
}

func (suite *AdminBackendTestSuite) SetupTest() {
	// Очищаємо базу даних перед кожним тестом
	suite.db.Exec("DELETE FROM users")
	suite.db.Exec("DELETE FROM administrators")
	suite.db.Exec("DELETE FROM categories")
	suite.db.Exec("DELETE FROM skills")
	suite.db.Exec("DELETE FROM plans")
	suite.db.Exec("DELETE FROM news")
	suite.db.Exec("DELETE FROM portfolios")
	suite.db.Exec("DELETE FROM photos")
	suite.db.Exec("DELETE FROM reviews")
	suite.db.Exec("DELETE FROM ratings")
	suite.db.Exec("DELETE FROM blog_posts")

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

	// Створюємо тестового користувача
	suite.user = &models.User{
		ID:        1,
		FirstName: "Test",
		LastName:  "User",
		Email:     "test@user.com",
		Role:      "client",
		Status:    "active",
		Verified:  true,
	}
	suite.db.Create(suite.user)
}

func (suite *AdminBackendTestSuite) setupRoutes() {
	// Налаштовуємо роути з middleware для тестування
	suite.router.Route("/api/admin", func(r chi.Router) {
		r.Use(suite.mockAdminMiddleware)

		// User management
		r.Post("/users", handlers.CreateUser)
		r.Get("/users", handlers.GetAllUsers)
		r.Get("/users/{id}", handlers.GetUser)
		r.Put("/users/{id}", handlers.UpdateUser)
		r.Delete("/users/{id}", handlers.DeleteUser)

		// Skills management
		r.Post("/skills", handlers.CreateSkill)
		r.Get("/skills", handlers.GetSkills)
		r.Delete("/skills/{id}", handlers.DeleteSkill)
		r.Put("/skills/{id}", handlers.UpdateSkill)

		// Categories management
		r.Post("/skills/categories", handlers.CreateSkillCategory)
		r.Get("/skills/categories", handlers.GetSkillCategories)
		r.Delete("/skills/categories/{id}", handlers.DeleteSkillCategory)
		r.Put("/skills/categories/{id}", handlers.UpdateSkillCategory)

		// Plans management
		r.Post("/plans", handlers.CreatePlan)
		r.Get("/plans", handlers.GetPlans)
		r.Delete("/plans/{id}", handlers.DeletePlan)

		// Administrators management
		r.Post("/administrators", handlers.CreateAdmin)
		r.Get("/administrators", handlers.GetAdministrators)
		r.Put("/administrators/{id}", handlers.UpdateAdmin)
		r.Delete("/administrators/{id}", handlers.DeleteAdmin)

		// News management
		r.Post("/news", handlers.CreateNews)
		r.Get("/news", handlers.GetAllNews)
		r.Get("/news/{id}", handlers.GetNews)
		r.Put("/news/{id}", handlers.UpdateNews)
		r.Delete("/news/{id}", handlers.DeleteNews)
		r.Patch("/news/{id}/publish", handlers.PublishNews)
	})
}

func (suite *AdminBackendTestSuite) mockAdminMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ctx := context.WithValue(r.Context(), "admin", suite.admin)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func (suite *AdminBackendTestSuite) TearDownSuite() {
	sqlDB, _ := suite.db.DB()
	sqlDB.Close()
}

// Tests for User Management

func (suite *AdminBackendTestSuite) TestCreateUser_Success() {
	userData := map[string]interface{}{
		"firstName": "New",
		"lastName":  "User",
		"email":     "new@user.com",
		"role":      "client",
		"password":  "password123",
	}

	body, _ := json.Marshal(userData)
	req := httptest.NewRequest("POST", "/api/admin/users", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusCreated, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(suite.T(), err)
	assert.True(suite.T(), response["success"].(bool))

	// Перевіряємо, що користувач створений в БД
	var user models.User
	err = suite.db.Where("email = ?", "new@user.com").First(&user).Error
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), "New", user.FirstName)
}

func (suite *AdminBackendTestSuite) TestCreateUser_InvalidJSON() {
	req := httptest.NewRequest("POST", "/api/admin/users", bytes.NewBuffer([]byte("invalid json")))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusBadRequest, w.Code)
}

func (suite *AdminBackendTestSuite) TestGetAllUsers_Success() {
	req := httptest.NewRequest("GET", "/api/admin/users", nil)
	w := httptest.NewRecorder()

	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusOK, w.Code)

	var users []models.User
	err := json.Unmarshal(w.Body.Bytes(), &users)
	assert.NoError(suite.T(), err)
	assert.Len(suite.T(), users, 1)
	assert.Equal(suite.T(), "test@user.com", users[0].Email)
}

func (suite *AdminBackendTestSuite) TestGetUser_Success() {
	req := httptest.NewRequest("GET", "/api/admin/users/1", nil)
	w := httptest.NewRecorder()

	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusOK, w.Code)

	var user models.User
	err := json.Unmarshal(w.Body.Bytes(), &user)
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), "test@user.com", user.Email)
}

func (suite *AdminBackendTestSuite) TestGetUser_NotFound() {
	req := httptest.NewRequest("GET", "/api/admin/users/999", nil)
	w := httptest.NewRecorder()

	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusNotFound, w.Code)
}

func (suite *AdminBackendTestSuite) TestUpdateUser_Success() {
	updateData := map[string]interface{}{
		"firstName": "Updated",
		"lastName":  "Name",
		"email":     "updated@user.com",
	}

	body, _ := json.Marshal(updateData)
	req := httptest.NewRequest("PUT", "/api/admin/users/1", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusOK, w.Code)

	// Перевіряємо, що дані оновлені в БД
	var user models.User
	suite.db.First(&user, 1)
	assert.Equal(suite.T(), "Updated", user.FirstName)
	assert.Equal(suite.T(), "updated@user.com", user.Email)
}

func (suite *AdminBackendTestSuite) TestDeleteUser_Success() {
	req := httptest.NewRequest("DELETE", "/api/admin/users/1", nil)
	w := httptest.NewRecorder()

	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusOK, w.Code)

	// Перевіряємо, що користувач видалений
	var count int64
	suite.db.Model(&models.User{}).Where("id = ?", 1).Count(&count)
	assert.Equal(suite.T(), int64(0), count)
}

// Tests for Skills Management

func (suite *AdminBackendTestSuite) TestCreateSkill_Success() {
	skillData := map[string]interface{}{
		"name": "Test Skill",
	}

	body, _ := json.Marshal(skillData)
	req := httptest.NewRequest("POST", "/api/admin/skills", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusCreated, w.Code)

	var skill models.Skill
	err := suite.db.Where("name = ?", "Test Skill").First(&skill).Error
	assert.NoError(suite.T(), err)
}

func (suite *AdminBackendTestSuite) TestCreateSkill_Duplicate() {
	// Створюємо навичку
	skill := models.Skill{Name: "Duplicate Skill"}
	suite.db.Create(&skill)

	// Намагаємося створити дублікат
	skillData := map[string]interface{}{
		"name": "Duplicate Skill",
	}

	body, _ := json.Marshal(skillData)
	req := httptest.NewRequest("POST", "/api/admin/skills", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusConflict, w.Code)
}

func (suite *AdminBackendTestSuite) TestGetSkills_Success() {
	// Створюємо тестову навичку
	skill := models.Skill{Name: "Test Skill"}
	suite.db.Create(&skill)

	req := httptest.NewRequest("GET", "/api/admin/skills", nil)
	w := httptest.NewRecorder()

	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusOK, w.Code)

	var skills []models.Skill
	err := json.Unmarshal(w.Body.Bytes(), &skills)
	assert.NoError(suite.T(), err)
	assert.Len(suite.T(), skills, 1)
	assert.Equal(suite.T(), "Test Skill", skills[0].Name)
}

func (suite *AdminBackendTestSuite) TestUpdateSkill_Success() {
	// Створюємо навичку
	skill := models.Skill{Name: "Old Name"}
	suite.db.Create(&skill)

	updateData := map[string]interface{}{
		"name": "New Name",
	}

	body, _ := json.Marshal(updateData)
	req := httptest.NewRequest("PUT", "/api/admin/skills/"+strconv.Itoa(int(skill.ID)), bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusOK, w.Code)

	// Перевіряємо оновлення
	var updatedSkill models.Skill
	suite.db.First(&updatedSkill, skill.ID)
	assert.Equal(suite.T(), "New Name", updatedSkill.Name)
}

func (suite *AdminBackendTestSuite) TestDeleteSkill_Success() {
	// Створюємо навичку
	skill := models.Skill{Name: "To Delete"}
	suite.db.Create(&skill)

	req := httptest.NewRequest("DELETE", "/api/admin/skills/"+strconv.Itoa(int(skill.ID)), nil)
	w := httptest.NewRecorder()

	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusOK, w.Code)

	// Перевіряємо видалення
	var count int64
	suite.db.Model(&models.Skill{}).Where("id = ?", skill.ID).Count(&count)
	assert.Equal(suite.T(), int64(0), count)
}

// Tests for Categories Management

func (suite *AdminBackendTestSuite) TestCreateSkillCategory_Success() {
	categoryData := map[string]interface{}{
		"name": "Test Category",
	}

	body, _ := json.Marshal(categoryData)
	req := httptest.NewRequest("POST", "/api/admin/skills/categories", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusCreated, w.Code)

	var category models.Category
	err := suite.db.Where("name = ?", "Test Category").First(&category).Error
	assert.NoError(suite.T(), err)
}

func (suite *AdminBackendTestSuite) TestGetSkillCategories_Success() {
	// Створюємо тестову категорію
	category := models.Category{Name: "Test Category"}
	suite.db.Create(&category)

	req := httptest.NewRequest("GET", "/api/admin/skills/categories", nil)
	w := httptest.NewRecorder()

	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusOK, w.Code)

	var categories []models.Category
	err := json.Unmarshal(w.Body.Bytes(), &categories)
	assert.NoError(suite.T(), err)
	assert.Len(suite.T(), categories, 1)
	assert.Equal(suite.T(), "Test Category", categories[0].Name)
}

// Tests for Plans Management

func (suite *AdminBackendTestSuite) TestCreatePlan_Success() {
	planData := map[string]interface{}{
		"name":        "Test Plan",
		"price":       99.99,
		"description": "Test description",
		"duration":    30,
	}

	body, _ := json.Marshal(planData)
	req := httptest.NewRequest("POST", "/api/admin/plans", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusCreated, w.Code)

	var plan models.Plan
	err := suite.db.Where("name = ?", "Test Plan").First(&plan).Error
	assert.NoError(suite.T(), err)
}

func (suite *AdminBackendTestSuite) TestGetPlans_Success() {
	// Створюємо тестовий план
	plan := models.Plan{Name: "Test Plan", Price: 99.99}
	suite.db.Create(&plan)

	req := httptest.NewRequest("GET", "/api/admin/plans", nil)
	w := httptest.NewRecorder()

	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusOK, w.Code)

	var plans []models.Plan
	err := json.Unmarshal(w.Body.Bytes(), &plans)
	assert.NoError(suite.T(), err)
	assert.Len(suite.T(), plans, 1)
	assert.Equal(suite.T(), "Test Plan", plans[0].Name)
}

func (suite *AdminBackendTestSuite) TestDeletePlan_Success() {
	// Створюємо план
	plan := models.Plan{Name: "To Delete", Price: 50.0}
	suite.db.Create(&plan)

	req := httptest.NewRequest("DELETE", "/api/admin/plans/"+strconv.Itoa(int(plan.ID)), nil)
	w := httptest.NewRecorder()

	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusOK, w.Code)

	// Перевіряємо видалення
	var count int64
	suite.db.Model(&models.Plan{}).Where("id = ?", plan.ID).Count(&count)
	assert.Equal(suite.T(), int64(0), count)
}

// Tests for Administrators Management

func (suite *AdminBackendTestSuite) TestGetAdministrators_Success() {
	req := httptest.NewRequest("GET", "/api/admin/administrators", nil)
	w := httptest.NewRecorder()

	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusOK, w.Code)

	var admins []models.Administrator
	err := json.Unmarshal(w.Body.Bytes(), &admins)
	assert.NoError(suite.T(), err)
	assert.Len(suite.T(), admins, 1)
	assert.Equal(suite.T(), "test@admin.com", admins[0].Email)
	assert.Empty(suite.T(), admins[0].Password) // Пароль не повинен повертатися
}

func (suite *AdminBackendTestSuite) TestCreateAdmin_Success() {
	adminData := map[string]interface{}{
		"firstName": "New",
		"lastName":  "Admin",
		"email":     "new@admin.com",
		"password":  "password123",
		"role":      "moderator",
	}

	body, _ := json.Marshal(adminData)
	req := httptest.NewRequest("POST", "/api/admin/administrators", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	suite.router.ServeHTTP(w, req)

	assert.Equal(suite
		"email":     "master@admin.com",
		"password":  "password123",
		"role":      "master",
	}

	body, _ := json.Marshal(adminData)
	req := httptest.NewRequest("POST", "/api/admin/administrators", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusForbidden, w.Code)
}

// Запуск тестів
func TestAdminHandlersTestSuite(t *testing.T) {
	suite.Run(t, new(AdminHandlersTestSuite))
}
