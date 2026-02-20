package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"
	"time"

	"user-api/internal/db"
	"user-api/internal/models"
	"user-api/internal/utils"
)

// SearchRequest structure for specialist search parameters
type SearchRequest struct {
	Gender        *string  `json:"gender"`        // "male", "female", "notselected"
	MinAge        *int     `json:"minAge"`        // minimum age
	MaxAge        *int     `json:"maxAge"`        // maximum age
	City          *string  `json:"city"`          // city
	SkillIDs      []uint64 `json:"skillIds"`      // array of skill IDs
	MinExperience *int     `json:"minExperience"` // minimum experience in years
	MaxExperience *int     `json:"maxExperience"` // maximum experience in years
	MinRate       *float64 `json:"minRate"`       // minimum hourly rate
	MaxRate       *float64 `json:"maxRate"`       // maximum hourly rate
	Page          int      `json:"page"`          // page for pagination
	Limit         int      `json:"limit"`         // items per page
}

// SearchSpecialistsResponse response structure
type SearchSpecialistsResponse struct {
	Specialists []SpecialistSearchResult `json:"specialists"`
	Total       int64                    `json:"total"`
	Page        int                      `json:"page"`
	Limit       int                      `json:"limit"`
	TotalPages  int                      `json:"totalPages"`
}

// SpecialistSearchResult specialist search result structure
type SpecialistSearchResult struct {
	ID        uint64                `json:"id"`
	FirstName string                `json:"firstName"`
	LastName  string                `json:"lastName"`
	Email     string                `json:"email"`
	Phone     *string               `json:"phone"`
	Portfolio PortfolioSearchResult `json:"portfolio"`
	Skills    []SkillSearchResult   `json:"skills"`
	Rating    *RatingSearchResult   `json:"rating"`
}

// PortfolioSearchResult portfolio structure for search
type PortfolioSearchResult struct {
	Description  string             `json:"description"`
	Experience   int                `json:"experience"`
	Educations   []models.Education `json:"educations"`
	Photos       []models.Photo     `json:"photos"`
	ContactEmail *string            `json:"contactEmail"`
	ContactPhone *string            `json:"contactPhone"`
	City         *string            `json:"city"`
	DateOfBirth  *time.Time         `json:"dateOfBirth"`
	Gender       *string            `json:"gender"`
	Age          *int               `json:"age"`
	Rate         *float64           `json:"rate"`
}

// SkillSearchResult skill structure for search
type SkillSearchResult struct {
	ID       uint64 `json:"id"`
	Name     string `json:"name"`
	Category string `json:"category"`
}

// RatingSearchResult rating structure for search
type RatingSearchResult struct {
	AverageRating float64 `json:"averageRating"`
	ReviewCount   int     `json:"reviewCount"`
}

// SearchSpecialists godoc
// @Summary      Search specialists
// @Description  Search for psychologists by gender, age, city and skills
// @Tags         Search
// @Accept       json
// @Produce      json
// @Param        search body SearchRequest true "Search criteria"
// @Success      200 {object} SearchSpecialistsResponse
// @Failure      400,500 {object} map[string]interface{}
// @Router       /api/users/search/specialists [post]
func SearchSpecialists(w http.ResponseWriter, r *http.Request) {
	var req SearchRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "INVALID_FORMAT", "Invalid request format")
		return
	}

	// Set default values for pagination
	if req.Page <= 0 {
		req.Page = 1
	}
	if req.Limit <= 0 || req.Limit > 100 {
		req.Limit = 20
	}

	// Build base query
	query := db.DB.Model(&models.User{}).
		Where("users.role = ? AND users.status = ?", "psychologist", "Active").
		Joins("LEFT JOIN portfolios ON portfolios.psychologist_id = users.id")

	// Filter by gender
	if req.Gender != nil && *req.Gender != "" && *req.Gender != "notselected" {
		query = query.Where("portfolios.gender = ?", *req.Gender)
	}

	// Filter by age (calculate birth dates)
	if req.MinAge != nil || req.MaxAge != nil {
		now := time.Now()

		if req.MaxAge != nil {
			// Minimum birth date (oldest age)
			minBirthDate := now.AddDate(-*req.MaxAge-1, 0, 0)
			query = query.Where("portfolios.date_of_birth >= ?", minBirthDate)
		}

		if req.MinAge != nil {
			// Maximum birth date (youngest age)
			maxBirthDate := now.AddDate(-*req.MinAge, 0, 0)
			query = query.Where("portfolios.date_of_birth <= ?", maxBirthDate)
		}
	}

	// Filter by city
	if req.City != nil && *req.City != "" {
		query = query.Where("LOWER(portfolios.city) LIKE ?", "%"+strings.ToLower(*req.City)+"%")
	}

	// Filter by experience
	if req.MinExperience != nil {
		query = query.Where("portfolios.experience >= ?", *req.MinExperience)
	}
	if req.MaxExperience != nil {
		query = query.Where("portfolios.experience <= ?", *req.MaxExperience)
	}

	// Filter by rate (price)
	if req.MinRate != nil {
		query = query.Where("portfolios.rate >= ?", *req.MinRate)
	}
	if req.MaxRate != nil {
		query = query.Where("portfolios.rate <= ?", *req.MaxRate)
	}

	// Filter by skills
	if len(req.SkillIDs) > 0 {
		query = query.Joins("JOIN psychologist_skills ON psychologist_skills.psychologist_id = users.id").
			Where("psychologist_skills.skill_id IN ?", req.SkillIDs).
			Group("users.id").
			Having("COUNT(DISTINCT psychologist_skills.skill_id) = ?", len(req.SkillIDs))
	}

	// Count total records
	var total int64
	countQuery := query
	if err := countQuery.Count(&total).Error; err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "DB_ERROR", "Failed to count specialists")
		return
	}

	// Get users with pagination
	var users []models.User
	offset := (req.Page - 1) * req.Limit
	if err := query.
		Preload("Portfolio").
		Preload("Portfolio.Educations").
		Preload("Portfolio.Photos").
		Preload("Skills").
		Preload("Skills.Category").
		Preload("Rating").
		Offset(offset).
		Limit(req.Limit).
		Order("users.id ASC").
		Find(&users).Error; err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "DB_ERROR", "Failed to fetch specialists")
		return
	}

	// Form the result
	specialists := make([]SpecialistSearchResult, 0, len(users))
	for _, user := range users {
		specialist := SpecialistSearchResult{
			ID:        user.ID,
			FirstName: user.FirstName,
			LastName:  user.LastName,
			Email:     user.Email,
			Phone:     user.Phone,
		}

		// Portfolio
		portfolio := PortfolioSearchResult{
			Description:  user.Portfolio.Description,
			Experience:   user.Portfolio.Experience,
			Educations:   user.Portfolio.Educations,
			Photos:       user.Portfolio.Photos,
			ContactEmail: user.Portfolio.ContactEmail,
			ContactPhone: user.Portfolio.ContactPhone,
			City:         user.Portfolio.City,
			DateOfBirth:  user.Portfolio.DateOfBirth,
			Gender:       user.Portfolio.Gender,
			Rate:         user.Portfolio.Rate,
		}

		// Calculate age
		if user.Portfolio.DateOfBirth != nil {
			age := calculateAge(*user.Portfolio.DateOfBirth)
			portfolio.Age = &age
		}

		specialist.Portfolio = portfolio

		// Skills
		skills := make([]SkillSearchResult, 0, len(user.Skills))
		for _, skill := range user.Skills {
			skills = append(skills, SkillSearchResult{
				ID:       skill.ID,
				Name:     skill.Name,
				Category: skill.Category.Name,
			})
		}
		specialist.Skills = skills

		// Rating
		if user.Rating.PsychologistID != 0 {
			specialist.Rating = &RatingSearchResult{
				AverageRating: user.Rating.AverageRating,
				ReviewCount:   user.Rating.ReviewCount,
			}
		}

		specialists = append(specialists, specialist)
	}

	// Calculate total pages
	totalPages := int((total + int64(req.Limit) - 1) / int64(req.Limit))

	response := SearchSpecialistsResponse{
		Specialists: specialists,
		Total:       total,
		Page:        req.Page,
		Limit:       req.Limit,
		TotalPages:  totalPages,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// calculateAge calculates age based on birth date
func calculateAge(birthDate time.Time) int {
	now := time.Now()
	age := now.Year() - birthDate.Year()

	// If birthday hasn't occurred this year yet, subtract 1
	if now.YearDay() < birthDate.YearDay() {
		age--
	}

	return age
}

// SearchSpecialistsGET godoc
// @Summary      Search specialists (GET)
// @Description  Search for psychologists using GET parameters
// @Tags         Search
// @Produce      json
// @Param        gender query string false "Gender filter (male, female, notselected)"
// @Param        minAge query int false "Minimum age"
// @Param        maxAge query int false "Maximum age"
// @Param        city query string false "City filter"
// @Param        skillIds query string false "Comma-separated skill IDs"
// @Param        minExperience query int false "Minimum experience in years"
// @Param        maxExperience query int false "Maximum experience in years"
// @Param        minRate query number false "Minimum hourly rate"
// @Param        maxRate query number false "Maximum hourly rate"
// @Param        page query int false "Page number (default: 1)"
// @Param        limit query int false "Items per page (default: 20, max: 100)"
// @Success      200 {object} SearchSpecialistsResponse
// @Failure      400,500 {object} map[string]interface{}
// @Router       /api/users/search/specialists [get]
func SearchSpecialistsGET(w http.ResponseWriter, r *http.Request) {
	var req SearchRequest

	// Parse parameters from URL
	if gender := r.URL.Query().Get("gender"); gender != "" {
		req.Gender = &gender
	}

	if minAgeStr := r.URL.Query().Get("minAge"); minAgeStr != "" {
		if minAge, err := strconv.Atoi(minAgeStr); err == nil {
			req.MinAge = &minAge
		}
	}

	if maxAgeStr := r.URL.Query().Get("maxAge"); maxAgeStr != "" {
		if maxAge, err := strconv.Atoi(maxAgeStr); err == nil {
			req.MaxAge = &maxAge
		}
	}

	if city := r.URL.Query().Get("city"); city != "" {
		req.City = &city
	}

	if skillIdsStr := r.URL.Query().Get("skillIds"); skillIdsStr != "" {
		skillIdStrs := strings.Split(skillIdsStr, ",")
		for _, skillIdStr := range skillIdStrs {
			if skillId, err := strconv.ParseUint(strings.TrimSpace(skillIdStr), 10, 64); err == nil {
				req.SkillIDs = append(req.SkillIDs, skillId)
			}
		}
	}

	if minExpStr := r.URL.Query().Get("minExperience"); minExpStr != "" {
		if minExp, err := strconv.Atoi(minExpStr); err == nil {
			req.MinExperience = &minExp
		}
	}

	if maxExpStr := r.URL.Query().Get("maxExperience"); maxExpStr != "" {
		if maxExp, err := strconv.Atoi(maxExpStr); err == nil {
			req.MaxExperience = &maxExp
		}
	}

	if minRateStr := r.URL.Query().Get("minRate"); minRateStr != "" {
		if minRate, err := strconv.ParseFloat(minRateStr, 64); err == nil {
			req.MinRate = &minRate
		}
	}

	if maxRateStr := r.URL.Query().Get("maxRate"); maxRateStr != "" {
		if maxRate, err := strconv.ParseFloat(maxRateStr, 64); err == nil {
			req.MaxRate = &maxRate
		}
	}

	if pageStr := r.URL.Query().Get("page"); pageStr != "" {
		if page, err := strconv.Atoi(pageStr); err == nil {
			req.Page = page
		}
	}

	if limitStr := r.URL.Query().Get("limit"); limitStr != "" {
		if limit, err := strconv.Atoi(limitStr); err == nil {
			req.Limit = limit
		}
	}

	// Create temporary request to call the main handler
	reqBody, _ := json.Marshal(req)
	newReq, _ := http.NewRequest("POST", r.URL.Path, strings.NewReader(string(reqBody)))
	newReq.Header.Set("Content-Type", "application/json")

	// Copy context
	newReq = newReq.WithContext(r.Context())

	SearchSpecialists(w, newReq)
}
