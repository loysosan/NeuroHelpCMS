package unit_tests

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"user-api/internal/models"

	"github.com/stretchr/testify/assert"
	"gorm.io/gorm"
)

type TestHelpers struct {
	db *gorm.DB
	t  *testing.T
}

func NewTestHelpers(db *gorm.DB, t *testing.T) *TestHelpers {
	return &TestHelpers{db: db, t: t}
}

// CreateTestUser creates a test user
func (h *TestHelpers) CreateTestUser(email string, role string) *models.User {
	user := &models.User{
		FirstName: "Test",
		LastName:  "User",
		Email:     email,
		Role:      role,
		Status:    "Active",
		Verified:  true,
	}
	err := h.db.Create(user).Error
	assert.NoError(h.t, err)
	return user
}

// MakeJSONRequest creates an HTTP request with a JSON body
func (h *TestHelpers) MakeJSONRequest(method, url string, data interface{}) (*httptest.ResponseRecorder, *http.Request) {
	body, _ := json.Marshal(data)
	req := httptest.NewRequest(method, url, bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	return w, req
}

// AssertUserExists checks if a user exists
func (h *TestHelpers) AssertUserExists(email string) {
	var user models.User
	err := h.db.Where("email = ?", email).First(&user).Error
	assert.NoError(h.t, err, "User should exist in database")
}
