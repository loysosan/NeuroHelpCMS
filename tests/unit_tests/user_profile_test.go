package unit_tests

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"user-api/internal/models"
	"user-api/internal/utils"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/suite"
)

type UserProfileTestSuite struct {
	suite.Suite
	router http.Handler
	db     *utils.MockDB
}

func (suite *UserProfileTestSuite) SetupTest() {
	suite.db = utils.NewMockDB()
	suite.router = utils.SetupRouter(suite.db)
}

func (suite *UserProfileTestSuite) TestGetUserProfile_Success() {
	// Создаем тестового пользователя
	user := models.User{
		ID:        1,
		Email:     "test@example.com",
		FirstName: "Test",
		LastName:  "User",
		Role:      "client",
		Status:    "Active",
	}
	suite.db.Create(&user)

	req := httptest.NewRequest("GET", "/api/users/1", nil)
	w := httptest.NewRecorder()

	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusOK, w.Code)

	var response models.User
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), user.Email, response.Email)
	assert.Empty(suite.T(), response.Password) // Проверяем, что пароль не возвращается
}

func (suite *UserProfileTestSuite) TestGetUserProfile_NotFound() {
	req := httptest.NewRequest("GET", "/api/users/999", nil)
	w := httptest.NewRecorder()

	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusNotFound, w.Code)
}

func (suite *UserProfileTestSuite) TestGetSelfProfile_Success() {
	// Создаем тестового пользователя
	user := models.User{
		ID:        1,
		Email:     "self@example.com",
		FirstName: "Self",
		LastName:  "User",
		Role:      "client",
		Status:    "Active",
	}
	suite.db.Create(&user)

	req := httptest.NewRequest("GET", "/api/users/self", nil)
	req = req.WithContext(utils.SetContextValue(req.Context(), "email", user.Email))
	w := httptest.NewRecorder()

	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusOK, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), user.Email, response["email"])
	assert.Empty(suite.T(), response["password"]) // Проверяем, что пароль не возвращается
}

func (suite *UserProfileTestSuite) TestGetSelfProfile_Unauthorized() {
	req := httptest.NewRequest("GET", "/api/users/self", nil)
	w := httptest.NewRecorder()

	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusUnauthorized, w.Code)
}

func (suite *UserProfileTestSuite) TestClientSelfUpdate_Success() {
	// Создаем тестового пользователя
	user := models.User{
		ID:        1,
		Email:     "update@example.com",
		FirstName: "OldFirstName",
		LastName:  "OldLastName",
		Role:      "client",
		Status:    "Active",
	}
	suite.db.Create(&user)

	updateData := map[string]interface{}{
		"firstName": "NewFirstName",
		"lastName":  "NewLastName",
		"phone":     "123456789",
	}
	body, _ := json.Marshal(updateData)
	req := httptest.NewRequest("PUT", "/api/users/self/updateuser", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	req = req.WithContext(utils.SetContextValue(req.Context(), "email", user.Email))
	w := httptest.NewRecorder()

	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusOK, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(suite.T(), err)
	assert.True(suite.T(), response["success"].(bool))
	assert.Equal(suite.T(), "Profile updated successfully", response["message"])
}

func (suite *UserProfileTestSuite) TestClientSelfUpdate_Unauthorized() {
	req := httptest.NewRequest("PUT", "/api/users/self/updateuser", nil)
	w := httptest.NewRecorder()

	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusUnauthorized, w.Code)
}

func TestUserProfileTestSuite(t *testing.T) {
	suite.Run(t, new(UserProfileTestSuite))
}
