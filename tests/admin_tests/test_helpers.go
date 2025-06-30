package admin_tests

import (
	"bytes"
	"encoding/json"
	"net/http/httptest"
	"testing"
	"user-api/internal/models"

	"github.com/stretchr/testify/assert"
	"gorm.io/gorm"
)

// TestHelpers містить допоміжні функції для тестування
type TestHelpers struct {
	db *gorm.DB
	t  *testing.T
}

func NewTestHelpers(db *gorm.DB, t *testing.T) *TestHelpers {
	return &TestHelpers{db: db, t: t}
}

// CreateTestUser створює тестового користувача в БД
func (h *TestHelpers) CreateTestUser(email string, role string) *models.User {
	user := &models.User{
		FirstName: "Test",
		LastName:  "User",
		Email:     email,
		Role:      role,
		Status:    "active",
		Verified:  true,
	}
	err := h.db.Create(user).Error
	assert.NoError(h.t, err)
	return user
}

// CreateTestAdmin створює тестового адміністратора в БД
func (h *TestHelpers) CreateTestAdmin(email string, role string) *models.Administrator {
	admin := &models.Administrator{
		FirstName: "Test",
		LastName:  "Admin",
		Email:     email,
		Role:      role,
		Status:    "active",
		Password:  "hashedpassword",
	}
	err := h.db.Create(admin).Error
	assert.NoError(h.t, err)
	return admin
}

// CreateTestSkill створює тестову навичку в БД
func (h *TestHelpers) CreateTestSkill(name string, categoryID *uint64) *models.Skill {
	skill := &models.Skill{
		Name:       name,
		CategoryID: categoryID,
	}
	err := h.db.Create(skill).Error
	assert.NoError(h.t, err)
	return skill
}

// CreateTestCategory створює тестову категорію в БД
func (h *TestHelpers) CreateTestCategory(name string) *models.Category {
	category := &models.Category{
		Name: name,
	}
	err := h.db.Create(category).Error
	assert.NoError(h.t, err)
	return category
}

// CreateTestPlan створює тестовий план в БД
func (h *TestHelpers) CreateTestPlan(name string, price float64) *models.Plan {
	plan := &models.Plan{
		Name:        name,
		Price:       price,
		Description: "Test plan description",
		Duration:    30,
	}
	err := h.db.Create(plan).Error
	assert.NoError(h.t, err)
	return plan
}

// CreateTestNews створює тестову новину в БД
func (h *TestHelpers) CreateTestNews(title string, authorID uint64) *models.News {
	news := &models.News{
		Title:     title,
		Content:   "Test content",
		Summary:   "Test summary",
		IsPublic:  true,
		Published: false,
		AuthorID:  authorID,
	}
	err := h.db.Create(news).Error
	assert.NoError(h.t, err)
	return news
}

// MakeJSONRequest створює HTTP запит з JSON тілом
func (h *TestHelpers) MakeJSONRequest(method, url string, data interface{}) (*httptest.ResponseRecorder, *httptest.Request) {
	var body *bytes.Buffer
	if data != nil {
		jsonData, err := json.Marshal(data)
		assert.NoError(h.t, err)
		body = bytes.NewBuffer(jsonData)
	} else {
		body = bytes.NewBuffer([]byte{})
	}

	req := httptest.NewRequest(method, url, body)
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	return w, req
}

// AssertResponseCode перевіряє код відповіді
func (h *TestHelpers) AssertResponseCode(w *httptest.ResponseRecorder, expectedCode int) {
	assert.Equal(h.t, expectedCode, w.Code, "Response code mismatch. Body: %s", w.Body.String())
}

// AssertJSONResponse перевіряє JSON відповідь
func (h *TestHelpers) AssertJSONResponse(w *httptest.ResponseRecorder, target interface{}) {
	err := json.Unmarshal(w.Body.Bytes(), target)
	assert.NoError(h.t, err, "Failed to parse JSON response: %s", w.Body.String())
}

// AssertDBCount перевіряє кількість записів в БД
func (h *TestHelpers) AssertDBCount(model interface{}, expectedCount int64) {
	var count int64
	err := h.db.Model(model).Count(&count).Error
	assert.NoError(h.t, err)
	assert.Equal(h.t, expectedCount, count)
}

// AssertRecordExists перевіряє існування запису в БД
func (h *TestHelpers) AssertRecordExists(model interface{}, condition string, args ...interface{}) {
	err := h.db.Where(condition, args...).First(model).Error
	assert.NoError(h.t, err, "Record should exist in database")
}

// AssertRecordNotExists перевіряє відсутність запису в БД
func (h *TestHelpers) AssertRecordNotExists(model interface{}, condition string, args ...interface{}) {
	err := h.db.Where(condition, args...).First(model).Error
	assert.Error(h.t, err, "Record should not exist in database")
}

// AssertNewsExists перевіряє існування новини з певними параметрами
func (h *TestHelpers) AssertNewsExists(title string, authorID uint64) {
	var news models.News
	err := h.db.Where("title = ? AND author_id = ?", title, authorID).First(&news).Error
	assert.NoError(h.t, err, "News should exist in database")
}

// AssertUserExists перевіряє існування користувача з певним email
func (h *TestHelpers) AssertUserExists(email string) {
	var user models.User
	err := h.db.Where("email = ?", email).First(&user).Error
	assert.NoError(h.t, err, "User should exist in database")
}

// AssertSkillExists перевіряє існування навички з певною назвою
func (h *TestHelpers) AssertSkillExists(name string) {
	var skill models.Skill
	err := h.db.Where("name = ?", name).First(&skill).Error
	assert.NoError(h.t, err, "Skill should exist in database")
}

// AssertAdminExists перевіряє існування адміністратора з певним email
func (h *TestHelpers) AssertAdminExists(email string) {
	var admin models.Administrator
	err := h.db.Where("email = ?", email).First(&admin).Error
	assert.NoError(h.t, err, "Administrator should exist in database")
}

// AssertPlanExists перевіряє існування плану з певною назвою
func (h *TestHelpers) AssertPlanExists(name string) {
	var plan models.Plan
	err := h.db.Where("name = ?", name).First(&plan).Error
	assert.NoError(h.t, err, "Plan should exist in database")
}

// GetModelCount повертає кількість записів для моделі
func (h *TestHelpers) GetModelCount(model interface{}) int64 {
	var count int64
	h.db.Model(model).Count(&count)
	return count
}

// CleanupDatabase очищає всі таблиці
func (h *TestHelpers) CleanupDatabase() {
	h.db.Exec("DELETE FROM news")
	h.db.Exec("DELETE FROM users")
	h.db.Exec("DELETE FROM administrators")
	h.db.Exec("DELETE FROM skills")
	h.db.Exec("DELETE FROM categories")
	h.db.Exec("DELETE FROM plans")
	h.db.Exec("DELETE FROM portfolios")
	h.db.Exec("DELETE FROM photos")
	h.db.Exec("DELETE FROM reviews")
	h.db.Exec("DELETE FROM ratings")
	h.db.Exec("DELETE FROM blog_posts")
}

// CreateTestPortfolio створює тестове портфоліо
func (h *TestHelpers) CreateTestPortfolio(psychologistID uint64) *models.Portfolio {
	portfolio := &models.Portfolio{
		PsychologistID: psychologistID,
		Description:    "Test portfolio description",
		Experience:     5,
		Education:      "Test University",
	}
	err := h.db.Create(portfolio).Error
	assert.NoError(h.t, err)
	return portfolio
}

// CreateTestReview створює тестовий відгук
func (h *TestHelpers) CreateTestReview(clientID, psychologistID uint64, rating int) *models.Review {
	comment := "Test review comment"
	review := &models.Review{
		ClientID:       clientID,
		PsychologistID: psychologistID,
		Rating:         rating,
		Comment:        &comment,
	}
	err := h.db.Create(review).Error
	assert.NoError(h.t, err)
	return review
}

// CreateTestBlogPost створює тестовий блог пост
func (h *TestHelpers) CreateTestBlogPost(psychologistID uint64, title string) *models.BlogPost {
	blogPost := &models.BlogPost{
		PsychologistID: psychologistID,
		Title:          title,
		Content:        "Test blog post content",
		Tags:           "test,blog",
		Published:      true,
	}
	err := h.db.Create(blogPost).Error
	assert.NoError(h.t, err)
	return blogPost
}
