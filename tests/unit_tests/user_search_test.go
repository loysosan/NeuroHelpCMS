package unit_tests

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"net/url"
	"os"
	"strings"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/suite"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"

	"user-api/internal/db"
	"user-api/internal/handlers"
	"user-api/internal/models"
)

type UserSearchTestSuite struct {
	suite.Suite
	testDB *gorm.DB
	users  []models.User
}

func (suite *UserSearchTestSuite) SetupSuite() {
	// Use test database from environment variables
	dbHost := getEnv("DB_HOST", "localhost")
	dbPort := getEnv("DB_PORT", "3307")
	dbName := getEnv("DB_NAME", "testdb")
	dbUser := getEnv("DB_USER", "testuser")
	dbPassword := getEnv("DB_PASSWORD", "testpass")

	dsn := dbUser + ":" + dbPassword + "@tcp(" + dbHost + ":" + dbPort + ")/" + dbName + "?charset=utf8mb4&parseTime=True&loc=Local"

	testDB, err := gorm.Open(mysql.Open(dsn), &gorm.Config{})
	suite.Require().NoError(err, "Failed to connect to test database")

	// Auto-migrate the schema
	err = testDB.AutoMigrate(
		&models.User{},
		&models.Portfolio{},
		&models.Skill{},
		&models.Category{},
		&models.PsychologistSkills{},
		&models.Rating{},
	)
	suite.Require().NoError(err)

	// Set the test database
	db.DB = testDB
	suite.testDB = testDB
}

func (suite *UserSearchTestSuite) TearDownSuite() {
	// Clean up database
	if suite.testDB != nil {
		sqlDB, _ := suite.testDB.DB()
		sqlDB.Close()
	}
}

func (suite *UserSearchTestSuite) SetupTest() {
	// Clean up data before each test
	suite.testDB.Exec("SET FOREIGN_KEY_CHECKS = 0")
	suite.testDB.Exec("TRUNCATE TABLE psychologist_skills")
	suite.testDB.Exec("TRUNCATE TABLE ratings")
	suite.testDB.Exec("TRUNCATE TABLE portfolios")
	suite.testDB.Exec("TRUNCATE TABLE skills")
	suite.testDB.Exec("TRUNCATE TABLE categories")
	suite.testDB.Exec("TRUNCATE TABLE users")
	suite.testDB.Exec("SET FOREIGN_KEY_CHECKS = 1")

	// Re-seed data
	suite.seedTestData()
}

func (suite *UserSearchTestSuite) seedTestData() {
	// Create categories
	category1 := models.Category{Name: "Therapy"}
	category2 := models.Category{Name: "Counseling"}
	suite.testDB.Create(&category1)
	suite.testDB.Create(&category2)

	// Create skills
	skill1 := models.Skill{Name: "CBT", CategoryID: category1.ID}
	skill2 := models.Skill{Name: "Family Therapy", CategoryID: category1.ID}
	skill3 := models.Skill{Name: "Marriage Counseling", CategoryID: category2.ID}
	suite.testDB.Create(&skill1)
	suite.testDB.Create(&skill2)
	suite.testDB.Create(&skill3)

	// Create test users
	birthDate1 := time.Date(1985, 1, 1, 0, 0, 0, 0, time.UTC)
	birthDate2 := time.Date(1990, 6, 15, 0, 0, 0, 0, time.UTC)
	birthDate3 := time.Date(1980, 12, 31, 0, 0, 0, 0, time.UTC)

	users := []models.User{
		{
			FirstName: "John",
			LastName:  "Doe",
			Email:     "john@example.com",
			Phone:     stringPtr("+1234567890"),
			Role:      "psychologist",
			Status:    "Active",
		},
		{
			FirstName: "Jane",
			LastName:  "Smith",
			Email:     "jane@example.com",
			Phone:     stringPtr("+1234567891"),
			Role:      "psychologist",
			Status:    "Active",
		},
		{
			FirstName: "Bob",
			LastName:  "Johnson",
			Email:     "bob@example.com",
			Role:      "psychologist",
			Status:    "Active",
		},
		{
			FirstName: "Alice",
			LastName:  "Williams",
			Email:     "alice@example.com",
			Role:      "user",
			Status:    "Active",
		},
	}

	for i := range users {
		suite.testDB.Create(&users[i])
	}

	// Create portfolios
	portfolios := []models.Portfolio{
		{
			PsychologistID: users[0].ID,
			Description:    "Experienced therapist",
			Experience:     5,
			Education:      "PhD in Psychology",
			ContactEmail:   stringPtr("john.contact@example.com"),
			City:           stringPtr("New York"),
			DateOfBirth:    &birthDate1,
			Gender:         stringPtr("male"),
		},
		{
			PsychologistID: users[1].ID,
			Description:    "Family specialist",
			Experience:     8,
			Education:      "MA in Family Therapy",
			ContactEmail:   stringPtr("jane.contact@example.com"),
			City:           stringPtr("Los Angeles"),
			DateOfBirth:    &birthDate2,
			Gender:         stringPtr("female"),
		},
		{
			PsychologistID: users[2].ID,
			Description:    "Cognitive behavioral therapist",
			Experience:     10,
			Education:      "PhD in Clinical Psychology",
			City:           stringPtr("Chicago"),
			DateOfBirth:    &birthDate3,
			Gender:         stringPtr("male"),
		},
	}

	for _, portfolio := range portfolios {
		suite.testDB.Create(&portfolio)
	}

	// Create psychologist skills associations
	psychSkills := []models.PsychologistSkills{
		{PsychologistID: users[0].ID, SkillID: skill1.ID},
		{PsychologistID: users[0].ID, SkillID: skill2.ID},
		{PsychologistID: users[1].ID, SkillID: skill2.ID},
		{PsychologistID: users[1].ID, SkillID: skill3.ID},
		{PsychologistID: users[2].ID, SkillID: skill1.ID},
	}

	for _, ps := range psychSkills {
		suite.testDB.Create(&ps)
	}

	// Create ratings
	ratings := []models.Rating{
		{PsychologistID: users[0].ID, AverageRating: 4.5, ReviewCount: 10},
		{PsychologistID: users[1].ID, AverageRating: 4.8, ReviewCount: 15},
		{PsychologistID: users[2].ID, AverageRating: 4.2, ReviewCount: 8},
	}

	for _, rating := range ratings {
		suite.testDB.Create(&rating)
	}

	suite.users = users
}

func (suite *UserSearchTestSuite) TestSearchSpecialists_ValidRequest() {
	searchReq := handlers.SearchRequest{
		Page:  1,
		Limit: 10,
	}

	body, _ := json.Marshal(searchReq)
	req := httptest.NewRequest("POST", "/api/users/search/specialists", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	handlers.SearchSpecialists(w, req)

	assert.Equal(suite.T(), http.StatusOK, w.Code)

	var response handlers.SearchSpecialistsResponse
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(suite.T(), err)

	// Should return 3 psychologists (excluding the user with role "user")
	assert.Equal(suite.T(), int64(3), response.Total)
	assert.Equal(suite.T(), 3, len(response.Specialists))
	assert.Equal(suite.T(), 1, response.Page)
	assert.Equal(suite.T(), 10, response.Limit)
	assert.Equal(suite.T(), 1, response.TotalPages)
}

func (suite *UserSearchTestSuite) TestSearchSpecialists_FilterByGender() {
	gender := "male"
	searchReq := handlers.SearchRequest{
		Gender: &gender,
		Page:   1,
		Limit:  10,
	}

	body, _ := json.Marshal(searchReq)
	req := httptest.NewRequest("POST", "/api/users/search/specialists", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	handlers.SearchSpecialists(w, req)

	assert.Equal(suite.T(), http.StatusOK, w.Code)

	var response handlers.SearchSpecialistsResponse
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(suite.T(), err)

	// Should return 2 male psychologists
	assert.Equal(suite.T(), int64(2), response.Total)
	assert.Equal(suite.T(), 2, len(response.Specialists))

	for _, specialist := range response.Specialists {
		assert.Equal(suite.T(), "male", *specialist.Portfolio.Gender)
	}
}

func (suite *UserSearchTestSuite) TestSearchSpecialists_FilterByAge() {
	minAge := 35
	maxAge := 45
	searchReq := handlers.SearchRequest{
		MinAge: &minAge,
		MaxAge: &maxAge,
		Page:   1,
		Limit:  10,
	}

	body, _ := json.Marshal(searchReq)
	req := httptest.NewRequest("POST", "/api/users/search/specialists", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	handlers.SearchSpecialists(w, req)

	assert.Equal(suite.T(), http.StatusOK, w.Code)

	var response handlers.SearchSpecialistsResponse
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(suite.T(), err)

	// Check that returned specialists are within age range
	for _, specialist := range response.Specialists {
		if specialist.Portfolio.Age != nil {
			assert.GreaterOrEqual(suite.T(), *specialist.Portfolio.Age, minAge)
			assert.LessOrEqual(suite.T(), *specialist.Portfolio.Age, maxAge)
		}
	}
}

func (suite *UserSearchTestSuite) TestSearchSpecialists_FilterByCity() {
	city := "new york"
	searchReq := handlers.SearchRequest{
		City:  &city,
		Page:  1,
		Limit: 10,
	}

	body, _ := json.Marshal(searchReq)
	req := httptest.NewRequest("POST", "/api/users/search/specialists", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	handlers.SearchSpecialists(w, req)

	assert.Equal(suite.T(), http.StatusOK, w.Code)

	var response handlers.SearchSpecialistsResponse
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(suite.T(), err)

	// Should return 1 specialist from New York
	assert.Equal(suite.T(), int64(1), response.Total)
	assert.Equal(suite.T(), 1, len(response.Specialists))
	assert.Contains(suite.T(), strings.ToLower(*response.Specialists[0].Portfolio.City), "new york")
}

func (suite *UserSearchTestSuite) TestSearchSpecialists_FilterBySkills() {
	// Get skill IDs from database
	var skills []models.Skill
	suite.testDB.Find(&skills)

	skillIDs := []uint64{skills[0].ID} // CBT skill
	searchReq := handlers.SearchRequest{
		SkillIDs: skillIDs,
		Page:     1,
		Limit:    10,
	}

	body, _ := json.Marshal(searchReq)
	req := httptest.NewRequest("POST", "/api/users/search/specialists", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	handlers.SearchSpecialists(w, req)

	assert.Equal(suite.T(), http.StatusOK, w.Code)

	var response handlers.SearchSpecialistsResponse
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(suite.T(), err)

	// Should return specialists with CBT skill
	assert.Greater(suite.T(), len(response.Specialists), 0)

	// Check that all returned specialists have the required skill
	for _, specialist := range response.Specialists {
		hasSkill := false
		for _, skill := range specialist.Skills {
			if skill.ID == skillIDs[0] {
				hasSkill = true
				break
			}
		}
		assert.True(suite.T(), hasSkill, "Specialist should have the required skill")
	}
}

func (suite *UserSearchTestSuite) TestSearchSpecialists_Pagination() {
	searchReq := handlers.SearchRequest{
		Page:  1,
		Limit: 2,
	}

	body, _ := json.Marshal(searchReq)
	req := httptest.NewRequest("POST", "/api/users/search/specialists", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	handlers.SearchSpecialists(w, req)

	assert.Equal(suite.T(), http.StatusOK, w.Code)

	var response handlers.SearchSpecialistsResponse
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(suite.T(), err)

	assert.Equal(suite.T(), int64(3), response.Total)
	assert.Equal(suite.T(), 2, len(response.Specialists))
	assert.Equal(suite.T(), 1, response.Page)
	assert.Equal(suite.T(), 2, response.Limit)
	assert.Equal(suite.T(), 2, response.TotalPages)
}

func (suite *UserSearchTestSuite) TestSearchSpecialists_InvalidJSON() {
	req := httptest.NewRequest("POST", "/api/users/search/specialists", strings.NewReader("invalid json"))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	handlers.SearchSpecialists(w, req)

	assert.Equal(suite.T(), http.StatusBadRequest, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), "INVALID_FORMAT", response["code"])
}

func (suite *UserSearchTestSuite) TestSearchSpecialists_DefaultPagination() {
	searchReq := handlers.SearchRequest{
		Page:  0, // Invalid page
		Limit: 0, // Invalid limit
	}

	body, _ := json.Marshal(searchReq)
	req := httptest.NewRequest("POST", "/api/users/search/specialists", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	handlers.SearchSpecialists(w, req)

	assert.Equal(suite.T(), http.StatusOK, w.Code)

	var response handlers.SearchSpecialistsResponse
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(suite.T(), err)

	// Should use default values
	assert.Equal(suite.T(), 1, response.Page)
	assert.Equal(suite.T(), 20, response.Limit)
}

func (suite *UserSearchTestSuite) TestSearchSpecialistsGET_ValidRequest() {
	req := httptest.NewRequest("GET", "/api/users/search/specialists?gender=female&page=1&limit=10", nil)
	w := httptest.NewRecorder()

	handlers.SearchSpecialistsGET(w, req)

	assert.Equal(suite.T(), http.StatusOK, w.Code)

	var response handlers.SearchSpecialistsResponse
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(suite.T(), err)

	// Should return 1 female psychologist
	assert.Equal(suite.T(), int64(1), response.Total)
	assert.Equal(suite.T(), 1, len(response.Specialists))
	assert.Equal(suite.T(), "female", *response.Specialists[0].Portfolio.Gender)
}

func (suite *UserSearchTestSuite) TestSearchSpecialistsGET_WithSkillIds() {
	// Get skill IDs from database
	var skills []models.Skill
	suite.testDB.Find(&skills)

	skillIdsParam := "1,2"
	reqURL := "/api/users/search/specialists?skillIds=" + skillIdsParam + "&page=1&limit=10"
	req := httptest.NewRequest("GET", reqURL, nil)
	w := httptest.NewRecorder()

	handlers.SearchSpecialistsGET(w, req)

	assert.Equal(suite.T(), http.StatusOK, w.Code)

	var response handlers.SearchSpecialistsResponse
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(suite.T(), err)

	// Response should be valid
	assert.GreaterOrEqual(suite.T(), response.Total, int64(0))
}

func (suite *UserSearchTestSuite) TestSearchSpecialistsGET_MultipleFilters() {
	params := url.Values{}
	params.Add("gender", "male")
	params.Add("minAge", "30")
	params.Add("maxAge", "50")
	params.Add("city", "chicago")
	params.Add("page", "1")
	params.Add("limit", "5")

	reqURL := "/api/users/search/specialists?" + params.Encode()
	req := httptest.NewRequest("GET", reqURL, nil)
	w := httptest.NewRecorder()

	handlers.SearchSpecialistsGET(w, req)

	assert.Equal(suite.T(), http.StatusOK, w.Code)

	var response handlers.SearchSpecialistsResponse
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(suite.T(), err)

	assert.Equal(suite.T(), 1, response.Page)
	assert.Equal(suite.T(), 5, response.Limit)
}

func (suite *UserSearchTestSuite) TestSearchSpecialists_EmptyResults() {
	city := "nonexistent city"
	searchReq := handlers.SearchRequest{
		City:  &city,
		Page:  1,
		Limit: 10,
	}

	body, _ := json.Marshal(searchReq)
	req := httptest.NewRequest("POST", "/api/users/search/specialists", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	handlers.SearchSpecialists(w, req)

	assert.Equal(suite.T(), http.StatusOK, w.Code)

	var response handlers.SearchSpecialistsResponse
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(suite.T(), err)

	assert.Equal(suite.T(), int64(0), response.Total)
	assert.Equal(suite.T(), 0, len(response.Specialists))
	assert.Equal(suite.T(), 0, response.TotalPages)
}

func (suite *UserSearchTestSuite) TestSearchSpecialists_RatingIncluded() {
	searchReq := handlers.SearchRequest{
		Page:  1,
		Limit: 10,
	}

	body, _ := json.Marshal(searchReq)
	req := httptest.NewRequest("POST", "/api/users/search/specialists", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	handlers.SearchSpecialists(w, req)

	assert.Equal(suite.T(), http.StatusOK, w.Code)

	var response handlers.SearchSpecialistsResponse
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(suite.T(), err)

	// Check that ratings are included for specialists who have them
	ratingFound := false
	for _, specialist := range response.Specialists {
		if specialist.Rating != nil {
			ratingFound = true
			assert.Greater(suite.T(), specialist.Rating.AverageRating, 0.0)
			assert.Greater(suite.T(), specialist.Rating.ReviewCount, 0)
		}
	}
	assert.True(suite.T(), ratingFound, "At least one specialist should have a rating")
}

func (suite *UserSearchTestSuite) TestSearchSpecialists_LimitValidation() {
	searchReq := handlers.SearchRequest{
		Page:  1,
		Limit: 150, // Exceeds max limit of 100
	}

	body, _ := json.Marshal(searchReq)
	req := httptest.NewRequest("POST", "/api/users/search/specialists", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	handlers.SearchSpecialists(w, req)

	assert.Equal(suite.T(), http.StatusOK, w.Code)

	var response handlers.SearchSpecialistsResponse
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(suite.T(), err)

	// Should use default limit of 20
	assert.Equal(suite.T(), 20, response.Limit)
}

func (suite *UserSearchTestSuite) TestSearchSpecialists_AgeCalculation() {
	searchReq := handlers.SearchRequest{
		Page:  1,
		Limit: 10,
	}

	body, _ := json.Marshal(searchReq)
	req := httptest.NewRequest("POST", "/api/users/search/specialists", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	handlers.SearchSpecialists(w, req)

	assert.Equal(suite.T(), http.StatusOK, w.Code)

	var response handlers.SearchSpecialistsResponse
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(suite.T(), err)

	// Check that age is calculated correctly for specialists with birth dates
	for _, specialist := range response.Specialists {
		if specialist.Portfolio.DateOfBirth != nil && specialist.Portfolio.Age != nil {
			expectedAge := time.Now().Year() - specialist.Portfolio.DateOfBirth.Year()
			if time.Now().YearDay() < specialist.Portfolio.DateOfBirth.YearDay() {
				expectedAge--
			}
			assert.Equal(suite.T(), expectedAge, *specialist.Portfolio.Age)
		}
	}
}

// Helper functions
func getEnv(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}

func TestUserSearchTestSuite(t *testing.T) {
	suite.Run(t, new(UserSearchTestSuite))
}
