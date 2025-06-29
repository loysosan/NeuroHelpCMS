package handlers

import (
    "crypto/rand"
    "encoding/hex"
    "encoding/json"
    "io"
    "net/http"
    "os"
    "path/filepath"
    "strconv"
    "strings"

    "github.com/go-chi/chi/v5"
    "github.com/rs/zerolog/log"
    "user-api/internal/db"
    "user-api/internal/models"
    "user-api/internal/utils"
)


// UpdateSelfPortfolio godoc
// @Summary      Update own portfolio
// @Description  Allows a psychologist to update their portfolio information
// @Tags         Actions for users
// @Accept       json
// @Produce      json
// @Param        portfolio body models.Portfolio true "Updated portfolio data"
// @Success      200 {object} map[string]interface{}
// @Failure      400,401,403,404,500 {object} map[string]interface{}
// @Router       /api/users/self/portfolio [put]
// @Security     BearerAuth
func UpdateSelfPortfolio(w http.ResponseWriter, r *http.Request) {
    email, ok := r.Context().Value("email").(string)
    if !ok || email == "" {
        utils.WriteError(w, http.StatusUnauthorized, "UNAUTHORIZED", "Unauthorized")
        return
    }

    var user models.User
    if err := db.DB.Preload("Portfolio").Where("email = ?", email).First(&user).Error; err != nil {
        utils.WriteError(w, http.StatusNotFound, "NOT_FOUND", "User not found")
        return
    }

    if user.Role != "psychologist" {
        utils.WriteError(w, http.StatusForbidden, "FORBIDDEN", "Only psychologists can update portfolio")
        return
    }

    // Parse request body
    var updateData struct {
        Description  string  `json:"description"`
        Experience   int     `json:"experience"`
        Education    string  `json:"education"`
        ContactEmail *string `json:"contactEmail"`
        ContactPhone *string `json:"contactPhone"`
    }
    if err := json.NewDecoder(r.Body).Decode(&updateData); err != nil {
        utils.WriteError(w, http.StatusBadRequest, "INVALID_FORMAT", "Invalid request format")
        return
    }

    // Create portfolio if it doesn't exist
    if user.Portfolio.ID == 0 {
        portfolio := models.Portfolio{
            PsychologistID: user.ID,
            Description:    updateData.Description,
            Experience:     updateData.Experience,
            Education:      updateData.Education,
            ContactEmail:   updateData.ContactEmail,
            ContactPhone:   updateData.ContactPhone,
        }

        if err := db.DB.Create(&portfolio).Error; err != nil {
            utils.WriteError(w, http.StatusInternalServerError, "DB_ERROR", "Failed to create portfolio")
            return
        }

        user.Portfolio = portfolio
    } else {
        // Update existing portfolio
        user.Portfolio.Description = updateData.Description
        user.Portfolio.Experience = updateData.Experience
        user.Portfolio.Education = updateData.Education
        user.Portfolio.ContactEmail = updateData.ContactEmail
        user.Portfolio.ContactPhone = updateData.ContactPhone

        if err := db.DB.Save(&user.Portfolio).Error; err != nil {
            utils.WriteError(w, http.StatusInternalServerError, "DB_ERROR", "Failed to update portfolio")
            return
        }
    }

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(map[string]interface{}{
        "success": true,
        "message": "Portfolio updated successfully",
        "data":    user.Portfolio,
    })
}

// UploadPortfolioPhoto godoc
// @Summary      Upload a portfolio photo
// @Description  Allows a psychologist to add a photo to their portfolio
// @Tags         Actions for users
// @Accept       multipart/form-data
// @Produce      json
// @Param        photo formData file true "Photo"
// @Success      201 {object} map[string]interface{}
// @Failure      400,401,403,404,500 {object} map[string]interface{}
// @Router       /api/users/portfolio/photo [post]
// @Security     BearerAuth
func UploadPortfolioPhoto(w http.ResponseWriter, r *http.Request) {
    email, ok := r.Context().Value("email").(string)
    if !ok || email == "" {
        utils.WriteError(w, http.StatusUnauthorized, "UNAUTHORIZED", "Unauthorized")
        return
    }

    var user models.User
    if err := db.DB.Preload("Portfolio").Where("email = ?", email).First(&user).Error; err != nil {
        utils.WriteError(w, http.StatusNotFound, "NOT_FOUND", "User not found")
        return
    }

    if user.Role != "psychologist" {
        utils.WriteError(w, http.StatusForbidden, "FORBIDDEN", "Only psychologists can upload photos")
        return
    }

    // Ensure portfolio exists
    if user.Portfolio.ID == 0 {
        portfolio := models.Portfolio{
            PsychologistID: user.ID,
        }
        if err := db.DB.Create(&portfolio).Error; err != nil {
            utils.WriteError(w, http.StatusInternalServerError, "DB_ERROR", "Failed to create portfolio")
            return
        }
        user.Portfolio = portfolio
    }

    // Parse multipart form
    if err := r.ParseMultipartForm(10 << 20); err != nil { // 10 MB limit
        utils.WriteError(w, http.StatusBadRequest, "INVALID_FORMAT", "Invalid multipart form")
        return
    }

    file, header, err := r.FormFile("photo")
    if err != nil {
        utils.WriteError(w, http.StatusBadRequest, "NO_FILE", "No photo file provided")
        return
    }
    defer file.Close()

    // Validate file type
    allowedTypes := map[string]bool{
        "image/jpeg": true,
        "image/jpg":  true,
        "image/png":  true,
        "image/webp": true,
    }

    contentType := header.Header.Get("Content-Type")
    if !allowedTypes[contentType] {
        utils.WriteError(w, http.StatusBadRequest, "INVALID_TYPE", "Invalid file type. Only JPEG, PNG, and WebP are allowed")
        return
    }

    // Create upload directory
    uploadDir := "./uploads/portfolio"
    if err := os.MkdirAll(uploadDir, 0755); err != nil {
        utils.WriteError(w, http.StatusInternalServerError, "UPLOAD_ERROR", "Failed to create upload directory")
        return
    }

    // Generate unique filename using UUID-like format
    uniqueID, err := generateUniqueID()
    if err != nil {
        utils.WriteError(w, http.StatusInternalServerError, "ID_GENERATION_ERROR", "Failed to generate unique ID")
        return
    }
    
    ext := filepath.Ext(header.Filename)
    filename := uniqueID + ext
    filePath := filepath.Join(uploadDir, filename)

    // Save file
    dst, err := os.Create(filePath)
    if err != nil {
        utils.WriteError(w, http.StatusInternalServerError, "UPLOAD_ERROR", "Failed to create file")
        return
    }
    defer dst.Close()

    if _, err := io.Copy(dst, file); err != nil {
        utils.WriteError(w, http.StatusInternalServerError, "UPLOAD_ERROR", "Failed to save file")
        return
    }

    // Save to database
    photo := models.Photo{
        PortfolioID: user.Portfolio.ID,
        URL:         "/uploads/portfolio/" + filename,
    }

    if err := db.DB.Create(&photo).Error; err != nil {
        // Clean up file if database save fails
        os.Remove(filePath)
        utils.WriteError(w, http.StatusInternalServerError, "DB_ERROR", "Failed to save photo record")
        return
    }

    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(http.StatusCreated)
    json.NewEncoder(w).Encode(map[string]interface{}{
        "success": true,
        "message": "Photo uploaded successfully",
        "data":    photo,
    })
}

// generateUniqueID creates a unique identifier using crypto/rand
func generateUniqueID() (string, error) {
    bytes := make([]byte, 16) // 128 bits
    if _, err := rand.Read(bytes); err != nil {
        return "", err
    }
    return hex.EncodeToString(bytes), nil
}

// DeletePortfolioPhoto godoc
// @Summary      Delete a portfolio photo
// @Description  Allows a psychologist to delete a photo from their portfolio
// @Tags         Actions for users
// @Produce      json
// @Param        photo_id path int true "Photo ID"
// @Success      200 {object} map[string]interface{}
// @Failure      401,403,404,500 {object} map[string]interface{}
// @Router       /api/users/portfolio/photo/{photo_id} [delete]
// @Security     BearerAuth
func DeletePortfolioPhoto(w http.ResponseWriter, r *http.Request) {
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
        utils.WriteError(w, http.StatusForbidden, "FORBIDDEN", "Only psychologists can delete photos")
        return
    }

    photoID, err := strconv.ParseUint(chi.URLParam(r, "photo_id"), 10, 64)
    if err != nil {
        utils.WriteError(w, http.StatusBadRequest, "INVALID_ID", "Invalid photo ID")
        return
    }

    // Знайти фото та перевірити, що воно належить користувачу
    var photo models.Photo
    if err := db.DB.Joins("JOIN portfolios ON photos.portfolio_id = portfolios.id").
        Where("photos.id = ? AND portfolios.psychologist_id = ?", photoID, user.ID).
        First(&photo).Error; err != nil {
        utils.WriteError(w, http.StatusNotFound, "NOT_FOUND", "Photo not found or access denied")
        return
    }

    // Видалити файл з файлової системи
    if photo.URL != "" {
        // Отримуємо шлях до файлу (видаляємо /uploads/ з початку)
        filePath := strings.TrimPrefix(photo.URL, "/uploads/")
        fullPath := filepath.Join("./uploads", filePath)
        
        if err := os.Remove(fullPath); err != nil {
            log.Error().Err(err).Str("path", fullPath).Msg("Failed to delete photo file")
            // Не повертаємо помилку, продовжуємо видаляти запис з БД
        }
    }

    // Видалити запис з бази даних
    if err := db.DB.Delete(&photo).Error; err != nil {
        utils.WriteError(w, http.StatusInternalServerError, "DB_ERROR", "Failed to delete photo record")
        return
    }

    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(http.StatusOK)
    json.NewEncoder(w).Encode(map[string]interface{}{
        "success": true,
        "message": "Photo deleted successfully",
    })
}