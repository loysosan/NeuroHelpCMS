package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"
	"user-api/internal/db"
	"user-api/internal/models"
    "user-api/internal/utils"

	"github.com/go-chi/chi/v5"
	"github.com/rs/zerolog/log"

)

// CreateNews godoc
// @Summary      Create a new news article
// @Description  Add a new news article (admin only)
// @Tags         Actions for administrators
// @Accept       json
// @Produce      json
// @Param        news body models.News true "News data"
// @Success      201 {object} map[string]interface{}
// @Failure      400,500 {object} map[string]interface{}
// @Router       /api/admin/news [post]
// @Security     BearerAuth
func CreateNews(w http.ResponseWriter, r *http.Request) {
    adminVal := r.Context().Value("admin")
    currentAdmin, ok := adminVal.(*models.Administrator)
    if !ok || currentAdmin == nil {
        utils.WriteError(w, http.StatusUnauthorized, "UNAUTHORIZED", "Authentication required")
        return
    }

    var news models.News
    if err := json.NewDecoder(r.Body).Decode(&news); err != nil {
        utils.WriteError(w, http.StatusBadRequest, "INVALID_JSON", "Incorrect request format")
        return
    }

    // Валідація
    if news.Title == "" || news.Content == "" {
        utils.WriteError(w, http.StatusBadRequest, "MISSING_FIELDS", "Title and content are required")
        return
    }

    // Встановлюємо автора та значення за замовчуванням
    news.AuthorID = currentAdmin.ID
    news.Views = 0

    if err := db.DB.Create(&news).Error; err != nil {
        log.Error().Err(err).Msg("Failed to create news")
        utils.WriteError(w, http.StatusInternalServerError, "DB_ERROR", "Unable to create news")
        return
    }

    // Завантажуємо автора для відповіді
    db.DB.Preload("Author").First(&news, news.ID)

    log.Info().Uint64("news_id", news.ID).Str("title", news.Title).Msg("News created")

    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(http.StatusCreated)
    json.NewEncoder(w).Encode(map[string]interface{}{
        "success": true,
        "data":    news,
    })
}

// GetAllNews godoc
// @Summary      Get all news articles
// @Description  Retrieve all news articles with filtering (admin only)
// @Tags         Actions for administrators
// @Produce      json
// @Param        published query bool false "Filter by published status"
// @Param        public query bool false "Filter by public status"
// @Success      200 {array} models.News
// @Failure      500 {object} map[string]interface{}
// @Router       /api/admin/news [get]
// @Security     BearerAuth
func GetAllNews(w http.ResponseWriter, r *http.Request) {
    query := db.DB.Model(&models.News{}).Preload("Author")

    // Фільтрація
    if published := r.URL.Query().Get("published"); published == "true" {
        query = query.Where("published = ?", true)
    } else if published == "false" {
        query = query.Where("published = ?", false)
    }

    if public := r.URL.Query().Get("public"); public == "true" {
        query = query.Where("is_public = ?", true)
    } else if public == "false" {
        query = query.Where("is_public = ?", false)
    }

    var news []models.News
    if err := query.Order("created_at DESC").Find(&news).Error; err != nil {
        utils.WriteError(w, http.StatusInternalServerError, "DB_ERROR", "Unable to retrieve news")
        return
    }

    // Очищаємо паролі авторів
    for i := range news {
        if news[i].Author.Password != "" {
            news[i].Author.Password = ""
        }
    }

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(news)
}

// GetNews godoc
// @Summary      Get news article by ID
// @Description  Retrieve a specific news article by ID (admin only)
// @Tags         Actions for administrators
// @Produce      json
// @Param        id path int true "News ID"
// @Success      200 {object} models.News
// @Failure      404 {object} map[string]interface{}
// @Router       /api/admin/news/{id} [get]
// @Security     BearerAuth
func GetNews(w http.ResponseWriter, r *http.Request) {
    id, err := strconv.Atoi(chi.URLParam(r, "id"))
    if err != nil {
        utils.WriteError(w, http.StatusBadRequest, "INVALID_ID", "Invalid news ID format")
        return
    }

    var news models.News
    if err := db.DB.Preload("Author").First(&news, id).Error; err != nil {
        utils.WriteError(w, http.StatusNotFound, "NEWS_NOT_FOUND", "News article not found")
        return
    }

    // Очищаємо пароль автора
    news.Author.Password = ""

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(news)
}

// UpdateNews godoc
// @Summary      Update news article
// @Description  Update a news article by ID (admin only)
// @Tags         Actions for administrators
// @Accept       json
// @Produce      json
// @Param        id path int true "News ID"
// @Param        news body models.News true "Updated news data"
// @Success      200 {object} map[string]interface{}
// @Failure      400,404,500 {object} map[string]interface{}
// @Router       /api/admin/news/{id} [put]
// @Security     BearerAuth
func UpdateNews(w http.ResponseWriter, r *http.Request) {
    currentAdmin := r.Context().Value("admin").(*models.Administrator)
    
    id, err := strconv.Atoi(chi.URLParam(r, "id"))
    if err != nil {
        utils.WriteError(w, http.StatusBadRequest, "INVALID_ID", "Invalid news ID format")
        return
    }

    var news models.News
    if err := db.DB.First(&news, id).Error; err != nil {
        utils.WriteError(w, http.StatusNotFound, "NEWS_NOT_FOUND", "News article not found")
        return
    }

    // Перевірка прав (автор або адмін/мастер)
    if currentAdmin.Role != "admin" && currentAdmin.Role != "master" && news.AuthorID != currentAdmin.ID {
        utils.WriteError(w, http.StatusForbidden, "FORBIDDEN", "You can only edit your own articles")
        return
    }

    var updatedNews models.News
    if err := json.NewDecoder(r.Body).Decode(&updatedNews); err != nil {
        utils.WriteError(w, http.StatusBadRequest, "INVALID_JSON", "Incorrect request format")
        return
    }

    if updatedNews.Title == "" || updatedNews.Content == "" {
        utils.WriteError(w, http.StatusBadRequest, "MISSING_FIELDS", "Title and content are required")
        return
    }

    // Оновлюємо поля
    news.Title = updatedNews.Title
    news.Content = updatedNews.Content
    news.Summary = updatedNews.Summary
    news.ImageURL = updatedNews.ImageURL
    news.IsPublic = updatedNews.IsPublic
    news.Published = updatedNews.Published

    if err := db.DB.Save(&news).Error; err != nil {
        utils.WriteError(w, http.StatusInternalServerError, "DB_ERROR", "Unable to update news")
        return
    }

    log.Info().Uint64("news_id", news.ID).Msg("News updated")

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(map[string]interface{}{
        "success": true,
        "data":    news,
    })
}

// DeleteNews godoc
// @Summary      Delete news article
// @Description  Delete a news article by ID (admin only)
// @Tags         Actions for administrators
// @Produce      json
// @Param        id path int true "News ID"
// @Success      200 {object} map[string]interface{}
// @Failure      404,403,500 {object} map[string]interface{}
// @Router       /api/admin/news/{id} [delete]
// @Security     BearerAuth
func DeleteNews(w http.ResponseWriter, r *http.Request) {
    currentAdmin := r.Context().Value("admin").(*models.Administrator)
    
    id, err := strconv.Atoi(chi.URLParam(r, "id"))
    if err != nil {
        utils.WriteError(w, http.StatusBadRequest, "INVALID_ID", "Invalid news ID format")
        return
    }

    var news models.News
    if err := db.DB.First(&news, id).Error; err != nil {
        utils.WriteError(w, http.StatusNotFound, "NEWS_NOT_FOUND", "News article not found")
        return
    }

    // Перевірка прав
    if currentAdmin.Role != "admin" && currentAdmin.Role != "master" && news.AuthorID != currentAdmin.ID {
        utils.WriteError(w, http.StatusForbidden, "FORBIDDEN", "You can only delete your own articles")
        return
    }

    if err := db.DB.Delete(&news).Error; err != nil {
        utils.WriteError(w, http.StatusInternalServerError, "DB_ERROR", "Unable to delete news")
        return
    }

    log.Info().Uint64("news_id", news.ID).Msg("News deleted")

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(map[string]interface{}{
        "success": true,
        "message": "News article deleted successfully",
    })
}


// GetPublicNews godoc
// @Summary      Get all published news
// @Description  Retrieve all published news articles (public access)
// @Tags         Public API
// @Produce      json
// @Param        limit query int false "Limit number of results"
// @Param        offset query int false "Offset for pagination"
// @Param        public query bool false "Filter by public status"
// @Success      200 {array} models.News
// @Failure      500 {object} map[string]interface{}
// @Router       /api/news [get]
func GetPublicNews(w http.ResponseWriter, r *http.Request) {
    query := db.DB.Model(&models.News{}).
        Preload("Author").
        Where("published = ?", true) // Тільки опубліковані новини

    // Фільтрація за публічністю (якщо користувач не авторизований)
    userContext := r.Context().Value("user")
    if userContext == nil {
        // Якщо користувач не авторизований - показуємо тільки публічні
        query = query.Where("is_public = ?", true)
    } else {
        // Якщо авторизований, можна показувати і приватні
        if public := r.URL.Query().Get("public"); public == "true" {
            query = query.Where("is_public = ?", true)
        }
    }

    // Пагінація
    if limit := r.URL.Query().Get("limit"); limit != "" {
        if l, err := strconv.Atoi(limit); err == nil && l > 0 && l <= 50 {
            query = query.Limit(l)
        }
    } else {
        query = query.Limit(10) // За замовчуванням 10
    }

    if offset := r.URL.Query().Get("offset"); offset != "" {
        if o, err := strconv.Atoi(offset); err == nil && o >= 0 {
            query = query.Offset(o)
        }
    }

    var news []models.News
    if err := query.Order("created_at DESC").Find(&news).Error; err != nil {
        utils.WriteError(w, http.StatusInternalServerError, "DB_ERROR", "Unable to retrieve news")
        return
    }

    // Очищаємо паролі авторів
    for i := range news {
        news[i].Author.Password = ""
    }

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(news)
}

// GetPublicNewsItem godoc
// @Summary      Get news article by ID
// @Description  Retrieve a specific published news article by ID (public access)
// @Tags         Public API
// @Produce      json
// @Param        id path int true "News ID"
// @Success      200 {object} models.News
// @Failure      404 {object} map[string]interface{}
// @Router       /api/news/{id} [get]
func GetPublicNewsItem(w http.ResponseWriter, r *http.Request) {
    id, err := strconv.Atoi(chi.URLParam(r, "id"))
    if err != nil {
        utils.WriteError(w, http.StatusBadRequest, "INVALID_ID", "Invalid news ID format")
        return
    }

    query := db.DB.Preload("Author").Where("published = ?", true)

    // Перевіряємо чи користувач авторизований
    userContext := r.Context().Value("user")
    if userContext == nil {
        // Якщо не авторизований - тільки публічні новини
        query = query.Where("is_public = ?", true)
    }

    var news models.News
    if err := query.First(&news, id).Error; err != nil {
        utils.WriteError(w, http.StatusNotFound, "NEWS_NOT_FOUND", "News article not found or not accessible")
        return
    }

    // Збільшуємо лічильник переглядів
    db.DB.Model(&news).Update("views", news.Views+1)
    news.Views++

    // Очищаємо пароль автора
    news.Author.Password = ""

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(news)
}

// GetNewsCount godoc
// @Summary      Get news count
// @Description  Get total count of published news articles
// @Tags         Public API
// @Produce      json
// @Success      200 {object} map[string]interface{}
// @Failure      500 {object} map[string]interface{}
// @Router       /api/news/count [get]
func GetNewsCount(w http.ResponseWriter, r *http.Request) {
    query := db.DB.Model(&models.News{}).Where("published = ?", true)

    // Якщо користувач не авторизований
    userContext := r.Context().Value("user")
    if userContext == nil {
        query = query.Where("is_public = ?", true)
    }

    var count int64
    if err := query.Count(&count).Error; err != nil {
        utils.WriteError(w, http.StatusInternalServerError, "DB_ERROR", "Unable to count news")
        return
    }

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(map[string]interface{}{
        "count": count,
    })
}