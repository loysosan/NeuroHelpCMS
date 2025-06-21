package handlers

import (


	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"time"
	"user-api/internal/db"
	"user-api/internal/models"
	"user-api/internal/utils"

	"github.com/go-chi/chi/v5"

	"github.com/rs/zerolog/log"
	"golang.org/x/crypto/bcrypt"

)



// processUserCreation centralizes validation, password hashing, existence check, and DB creation.
// Returns true if user was created successfully, false if a response has already been written.
func processUserCreation(w http.ResponseWriter, user *models.User) bool {
    // Role Validation
    if user.Role != "client" && user.Role != "psychologist" {
        log.Warn().Str("role", user.Role).Msg("processUserCreation: invalid role")
        utils.WriteError(w, http.StatusBadRequest, "INVALID_ROLE", "Role must be 'client' or 'psychologist'")
        return false
    }
    // Password hashing
    hashedPassword, err := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)
    if err != nil {
        log.Error().Err(err).Msg("processUserCreation: password hashing failed")
        utils.WriteError(w, http.StatusInternalServerError, "HASH_ERROR", "Unable to hash password")
        return false
    }
    user.Password = string(hashedPassword)
    // Check existing email
    var existing models.User
    if err := db.DB.Where("email = ?", user.Email).First(&existing).Error; err == nil {
        log.Warn().Str("email", user.Email).Msg("processUserCreation: user with this email already exists")
        utils.WriteError(w, http.StatusConflict, "USER_ALREADY_EXISTS", "User with this email already exists")
        return false
    }
    // Create user in DB
    if err := db.DB.Create(user).Error; err != nil {
        log.Error().Err(err).Msg("processUserCreation: failed to create user in database")
        utils.WriteError(w, http.StatusInternalServerError, "DB_ERROR", "Unable to create user")
        return false
    }
    return true
}

// generateAndSaveVerification builds a secure token, saves it on the user, and returns the verification URL.
func generateAndSaveVerification(user *models.User) (string, error) {
    token, err := generateToken(32)
    if err != nil {
        return "", err
    }
    user.VerificationToken = token
    user.TokenSentAt = time.Now()
    if err := db.DB.Save(user).Error; err != nil {
        return "", err
    }
    verifyURL := fmt.Sprintf("%s/verify?token=%s",
        cfg.Section("app").Key("frontend_url").String(),
        token,
    )
    return verifyURL, nil
}


// GetUser godoc
// @Summary      Get selected user information
// @Description  Recive user information via ID
// @Tags         Actions for users
// @Produce      json
// @Param        id path int true "User ID"
// @Success      200 {object} models.User
// @Failure      404 {object} map[string]interface{}
// @Router       /api/users/{id} [get]
// @Security BearerAuth
func ClientGetUser(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.Atoi(chi.URLParam(r, "id"))
	var user models.User
	result := db.DB.First(&user, id)
	if result.Error != nil {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(user)
}


// CreateReview godoc
// @Summary      Create a review for a psychologist
// @Description  A client can add a rating and an optional comment for a psychologist
// @Tags         Actions for users
// @Accept       json
// @Produce      json
// @Param        psychologist_id path int true "Psychologist ID"
// @Param        review body models.Review true "Review data"
// @Success      201 {object} map[string]interface{}
// @Failure      400 {object} map[string]string "Invalid data"
// @Failure      403 {object} map[string]string "Access denied"
// @Failure      404 {object} map[string]string "Psychologist not found"
// @Failure      500 {object} map[string]string "Server error"
// @Router       /api/reviews/{psychologist_id} [post]
// @Security     BearerAuth
func CreateReview(w http.ResponseWriter, r *http.Request) {
    // Get psychologist ID from URL
    psychologistID, err := strconv.ParseUint(chi.URLParam(r, "psychologist_id"), 10, 64)
    if err != nil {
        utils.WriteError(w, http.StatusBadRequest, "INVALID_ID", "Invalid psychologist ID")
        return
    }

    // Get client email from context (set by auth middleware)
    clientEmail := r.Context().Value("email").(string)
    
    // Get client data from DB
    var client models.User
    if err := db.DB.Where("email = ?", clientEmail).First(&client).Error; err != nil {
        utils.WriteError(w, http.StatusInternalServerError, "DB_ERROR", "Failed to retrieve client data")
        return
    }

    // Check user role
    if client.Role != "client" {
        utils.WriteError(w, http.StatusForbidden, "FORBIDDEN", "Only clients can leave reviews")
        return
    }

    // Check psychologist existence
    var psychologist models.User
    if err := db.DB.Where("id = ? AND role = ?", psychologistID, "psychologist").First(&psychologist).Error; err != nil {
        utils.WriteError(w, http.StatusNotFound, "NOT_FOUND", "Psychologist not found")
        return
    }

    // Parse request body
    var reviewReq models.Review
    if err := json.NewDecoder(r.Body).Decode(&reviewReq); err != nil {
        utils.WriteError(w, http.StatusBadRequest, "INVALID_FORMAT", "Invalid request format")
        return
    }

    // Create review
    review := models.Review{
        PsychologistID: psychologistID,
        ClientID:       client.ID,
        Rating:         reviewReq.Rating,
        Comment:        reviewReq.Comment,
    }

    // Save review
    if err := db.DB.Create(&review).Error; err != nil {
        utils.WriteError(w, http.StatusInternalServerError, "DB_ERROR", "Failed to save review")
        return
    }

    // Update psychologist rating
    var avgRating float64
    var count int64
    db.DB.Model(&models.Review{}).Where("psychologist_id = ?", psychologistID).
        Select("AVG(rating) as avg_rating, COUNT(*) as count").
        Row().Scan(&avgRating, &count)

    rating := models.Rating{
        PsychologistID: psychologistID,
        AverageRating:  avgRating,
        ReviewCount:    int(count),
    }
    db.DB.Save(&rating)

    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(http.StatusCreated)
    json.NewEncoder(w).Encode(map[string]interface{}{
        "success": true,
        "message": "Review successfully created",
        "data": map[string]interface{}{
            "review_id": review.ID,
            "rating":    review.Rating,
            "comment":   review.Comment,
        },
    })
}

// ClientSelfUpdate godoc
// @Summary      Update own profile
// @Description  Allows a client to update their personal information
// @Tags         Actions for users
// @Accept       json
// @Produce      json
// @Param        user body models.User true "Updated user data"
// @Success      200 {object} map[string]interface{}
// @Failure      400,401,403,404,500 {object} map[string]interface{}
// @Router       /api/users/self/updateuser [put]
// @Security     BearerAuth
func ClientSelfUpdate(w http.ResponseWriter, r *http.Request) {
    // Get client email from context (set by auth middleware)
    email, ok := r.Context().Value("email").(string)
    if !ok || email == "" {
        utils.WriteError(w, http.StatusUnauthorized, "UNAUTHORIZED", "Unauthorized")
        return
    }

    // Find user by email
    var user models.User
    if err := db.DB.Where("email = ?", email).First(&user).Error; err != nil {
        utils.WriteError(w, http.StatusNotFound, "NOT_FOUND", "User not found")
        return
    }

    // Only allow clients to update their data
    if user.Role != "client" {
        utils.WriteError(w, http.StatusForbidden, "FORBIDDEN", "Only clients can update their profile")
        return
    }

    // Parse request body
    var updateData models.User
    if err := json.NewDecoder(r.Body).Decode(&updateData); err != nil {
        utils.WriteError(w, http.StatusBadRequest, "INVALID_FORMAT", "Invalid request format")
        return
    }

    // Update allowed fields
    if updateData.FirstName != "" {
        user.FirstName = updateData.FirstName
    }
    if updateData.LastName != "" {
        user.LastName = updateData.LastName
    }
    if updateData.Phone != nil {
        user.Phone = updateData.Phone
    }

    // Save changes
    if err := db.DB.Save(&user).Error; err != nil {
        utils.WriteError(w, http.StatusInternalServerError, "DB_ERROR", "Failed to update user")
        return
    }

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(map[string]interface{}{
        "success": true,
        "data":    user,
    })
}

// CreateBlogPost godoc
// @Summary      Додати запис у блог
// @Description  Дозволяє психологу додати новий запис у свій блог
// @Tags         Actions for users
// @Accept       json
// @Produce      json
// @Param        post body models.BlogPost true "Дані блогу"
// @Success      201 {object} map[string]interface{}
// @Failure      400,401,403,500 {object} map[string]interface{}
// @Router       /api/users/blog [post]
// @Security     BearerAuth
func CreateBlogPost(w http.ResponseWriter, r *http.Request) {
    email, ok := r.Context().Value("email").(string)
    if !ok || email == "" {
        utils.WriteError(w, http.StatusUnauthorized, "UNAUTHORIZED", "Unauthorized")
        return
    }

    var user models.User
    if err := db.DB.Where("email = ?", email).First(&user).Error; err != nil {
        utils.WriteError(w, http.StatusNotFound, "NOT_FOUND", "User not found")
        return
    }
    if user.Role != "psychologist" {
        utils.WriteError(w, http.StatusForbidden, "FORBIDDEN", "Only psychologists can add blog posts")
        return
    }

    var post models.BlogPost
    if err := json.NewDecoder(r.Body).Decode(&post); err != nil {
        utils.WriteError(w, http.StatusBadRequest, "INVALID_FORMAT", "Invalid request format")
        return
    }
    post.PsychologistID = user.ID

    if err := db.DB.Create(&post).Error; err != nil {
        utils.WriteError(w, http.StatusInternalServerError, "DB_ERROR", "Failed to create blog post")
        return
    }

    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(http.StatusCreated)
    json.NewEncoder(w).Encode(map[string]interface{}{
        "success": true,
        "data":    post,
    })
}

// GetBlogPosts godoc
// @Summary      Переглянути записи блогу психолога
// @Description  Повертає всі записи блогу для вказаного психолога
// @Tags         Actions for users
// @Produce      json
// @Param        psychologist_id path int true "ID психолога"
// @Success      200 {array} models.BlogPost
// @Failure      404,500 {object} map[string]interface{}
// @Router       /api/users/blog/{psychologist_id} [get]
func GetBlogPosts(w http.ResponseWriter, r *http.Request) {
    psychologistID, err := strconv.ParseUint(chi.URLParam(r, "psychologist_id"), 10, 64)
    if err != nil {
        utils.WriteError(w, http.StatusBadRequest, "INVALID_ID", "Invalid psychologist ID")
        return
    }

    var posts []models.BlogPost
    if err := db.DB.Where("psychologist_id = ?", psychologistID).Order("created_at desc").Find(&posts).Error; err != nil {
        utils.WriteError(w, http.StatusInternalServerError, "DB_ERROR", "Failed to fetch blog posts")
        return
    }

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(posts)
}

// SetSpecialistSkills godoc
// @Summary      Встановити навички психолога
// @Description  Дозволяє психологу вибрати свої навички з доступних
// @Tags         Actions for users
// @Accept       json
// @Produce      json
// @Param        skills body []uint64 true "Масив ID навичок"
// @Success      200 {object} map[string]interface{}
// @Failure      400,401,403,404,500 {object} map[string]interface{}
// @Router       /api/users/self/skills [put]
// @Security     BearerAuth
func SetSpecialistSkills(w http.ResponseWriter, r *http.Request) {
    email, ok := r.Context().Value("email").(string)
    if !ok || email == "" {
        utils.WriteError(w, http.StatusUnauthorized, "UNAUTHORIZED", "Unauthorized")
        return
    }

    var user models.User
    if err := db.DB.Where("email = ?", email).First(&user).Error; err != nil {
        utils.WriteError(w, http.StatusNotFound, "NOT_FOUND", "User not found")
        return
    }
    if user.Role != "psychologist" {
        utils.WriteError(w, http.StatusForbidden, "FORBIDDEN", "Only psychologists can set skills")
        return
    }

    var skillIDs []uint64
    if err := json.NewDecoder(r.Body).Decode(&skillIDs); err != nil {
        utils.WriteError(w, http.StatusBadRequest, "INVALID_FORMAT", "Invalid request format")
        return
    }

    // Перевіряємо чи всі навички існують
    var skills []models.Skill
    if len(skillIDs) > 0 {
        if err := db.DB.Where("id IN ?", skillIDs).Find(&skills).Error; err != nil {
            utils.WriteError(w, http.StatusInternalServerError, "DB_ERROR", "Failed to fetch skills")
            return
        }
        if len(skills) != len(skillIDs) {
            utils.WriteError(w, http.StatusBadRequest, "INVALID_SKILL", "One or more skills not found")
            return
        }
    }

    // Оновлюємо many2many зв'язок
    if err := db.DB.Model(&user).Association("Skills").Replace(skills); err != nil {
        utils.WriteError(w, http.StatusInternalServerError, "DB_ERROR", "Failed to update skills")
        return
    }

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(map[string]interface{}{
        "success": true,
        "message": "Skills updated",
    })
}


// GetAllSkillsByCategory godoc
// @Summary      Отримати всі скіли з категоріями
// @Description  Повертає всі навички, згруповані по категоріях
// @Tags         Actions for users
// @Produce      json
// @Success      200 {array} map[string]interface{}
// @Failure      500 {object} map[string]interface{}
// @Router       /api/users/skills [get]
func GetAllSkillsByCategory(w http.ResponseWriter, r *http.Request) {
    var categories []models.Category
    if err := db.DB.Preload("Skills").Find(&categories).Error; err != nil {
        utils.WriteError(w, http.StatusInternalServerError, "DB_ERROR", "Failed to fetch skills")
        return
    }

    result := make([]map[string]interface{}, 0, len(categories))
    for _, cat := range categories {
        result = append(result, map[string]interface{}{
            "id":    cat.ID,
            "name":  cat.Name,
            "skills": cat.Skills,
        })
    }

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(result)
}

// GetUserSkills godoc
// @Summary      Отримати всі скіли користувача
// @Description  Повертає всі навички, які призначені конкретному користувачу
// @Tags         Actions for users
// @Produce      json
// @Param        user_id path int true "User ID"
// @Success      200 {array} models.Skill
// @Failure      404,500 {object} map[string]interface{}
// @Router       /api/users/{user_id}/skills [get]
func GetUserSkills(w http.ResponseWriter, r *http.Request) {
    userID, err := strconv.ParseUint(chi.URLParam(r, "user_id"), 10, 64)
    if err != nil {
        utils.WriteError(w, http.StatusBadRequest, "INVALID_ID", "Invalid user ID")
        return
    }

    var user models.User
    if err := db.DB.Preload("Skills").First(&user, userID).Error; err != nil {
        utils.WriteError(w, http.StatusNotFound, "NOT_FOUND", "User not found")
        return
    }

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(user.Skills)
}