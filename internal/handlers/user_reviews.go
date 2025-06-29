package handlers

import (
    "encoding/json"
    "net/http"
    "strconv"

    "github.com/go-chi/chi/v5"
    "user-api/internal/db"
    "user-api/internal/models"
    "user-api/internal/utils"
)

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
    email, ok := r.Context().Value("email").(string)
    if !ok || email == "" {
        utils.WriteError(w, http.StatusUnauthorized, "UNAUTHORIZED", "Unauthorized")
        return
    }

    psychologistID, err := strconv.ParseUint(chi.URLParam(r, "psychologist_id"), 10, 64)
    if err != nil {
        utils.WriteError(w, http.StatusBadRequest, "INVALID_ID", "Invalid psychologist ID")
        return
    }

    var client models.User
    if err := db.DB.Where("email = ?", email).First(&client).Error; err != nil {
        utils.WriteError(w, http.StatusNotFound, "NOT_FOUND", "User not found")
        return
    }

    if client.Role != "client" {
        utils.WriteError(w, http.StatusForbidden, "FORBIDDEN", "Only clients can create reviews")
        return
    }

    // Verify psychologist exists
    var psychologist models.User
    if err := db.DB.Where("id = ? AND role = ?", psychologistID, "psychologist").First(&psychologist).Error; err != nil {
        utils.WriteError(w, http.StatusNotFound, "NOT_FOUND", "Psychologist not found")
        return
    }

    // Check if client already reviewed this psychologist
    var existingReview models.Review
    if err := db.DB.Where("client_id = ? AND psychologist_id = ?", client.ID, psychologistID).First(&existingReview).Error; err == nil {
        utils.WriteError(w, http.StatusBadRequest, "ALREADY_REVIEWED", "You have already reviewed this psychologist")
        return
    }

    // Parse review data
    var reviewData struct {
        Rating  int    `json:"rating"`
        Comment string `json:"comment"`
    }
    if err := json.NewDecoder(r.Body).Decode(&reviewData); err != nil {
        utils.WriteError(w, http.StatusBadRequest, "INVALID_FORMAT", "Invalid request format")
        return
    }

    // Validate rating
    if reviewData.Rating < 1 || reviewData.Rating > 5 {
        utils.WriteError(w, http.StatusBadRequest, "INVALID_RATING", "Rating must be between 1 and 5")
        return
    }

    // Create review
    review := models.Review{
        ClientID:       client.ID,
        PsychologistID: psychologistID,
        Rating:         reviewData.Rating,
        Comment:        &reviewData.Comment, // Додайте & для отримання вказівника
    }

    if err := db.DB.Create(&review).Error; err != nil {
        utils.WriteError(w, http.StatusInternalServerError, "DB_ERROR", "Failed to create review")
        return
    }

    // Update psychologist's average rating
    updatePsychologistRating(psychologistID)

    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(http.StatusCreated)
    json.NewEncoder(w).Encode(map[string]interface{}{
        "success": true,
        "message": "Review created successfully",
        "data":    review,
    })
}

// updatePsychologistRating calculates and updates the average rating for a psychologist
func updatePsychologistRating(psychologistID uint64) {
    var avgRating float64
    var reviewCount int64

    // Calculate average rating and count
    db.DB.Model(&models.Review{}).Where("psychologist_id = ?", psychologistID).
        Select("AVG(rating) as avg_rating, COUNT(*) as review_count").
        Row().Scan(&avgRating, &reviewCount)

    // Update or create rating record
    var rating models.Rating
    if err := db.DB.Where("psychologist_id = ?", psychologistID).First(&rating).Error; err != nil {
        // Create new rating record
        rating = models.Rating{
            PsychologistID:  psychologistID,
            AverageRating:   avgRating,
            ReviewCount:     int(reviewCount),
        }
        db.DB.Create(&rating)
    } else {
        // Update existing rating record
        rating.AverageRating = avgRating
        rating.ReviewCount = int(reviewCount)
        db.DB.Save(&rating)
    }
}