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


// CreateBlogPost godoc
// @Summary      Add a blog post
// @Description  Allows a psychologist to add a new blog post
// @Tags         Actions for users
// @Accept       json
// @Produce      json
// @Param        post body models.BlogPost true "Blog data"
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
        "message": "Blog post created successfully",
        "data":    post,
    })
}

// GetBlogPosts godoc
// @Summary      View psychologist's blog posts
// @Description  Returns all blog posts for the specified psychologist
// @Tags         Actions for users
// @Produce      json
// @Param        psychologist_id path int true "Psychologist ID"
// @Success      200 {array} models.BlogPost
// @Failure      404,500 {object} map[string]interface{}
// @Router       /api/users/blog/{psychologist_id} [get]
func GetBlogPosts(w http.ResponseWriter, r *http.Request) {
    psychologistID, err := strconv.ParseUint(chi.URLParam(r, "psychologist_id"), 10, 64)
    if err != nil {
        utils.WriteError(w, http.StatusBadRequest, "INVALID_ID", "Invalid psychologist ID")
        return
    }

    // Verify psychologist exists
    var user models.User
    if err := db.DB.Where("id = ? AND role = ?", psychologistID, "psychologist").First(&user).Error; err != nil {
        utils.WriteError(w, http.StatusNotFound, "NOT_FOUND", "Psychologist not found")
        return
    }

    var posts []models.BlogPost
    if err := db.DB.Where("psychologist_id = ?", psychologistID).Order("created_at DESC").Find(&posts).Error; err != nil {
        utils.WriteError(w, http.StatusInternalServerError, "DB_ERROR", "Failed to fetch blog posts")
        return
    }

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(posts)
}

// GetBlogPost godoc
// @Summary      Get a single blog post
// @Description  Returns a single blog post by its ID
// @Tags         Actions for users
// @Produce      json
// @Param        blog_id path int true "Blog post ID"
// @Success      200 {object} models.BlogPost
// @Failure      404,500 {object} map[string]interface{}
// @Router       /api/users/blog/post/{blog_id} [get]
func GetBlogPost(w http.ResponseWriter, r *http.Request) {
    blogID, err := strconv.ParseUint(chi.URLParam(r, "blog_id"), 10, 64)
    if err != nil {
        utils.WriteError(w, http.StatusBadRequest, "INVALID_ID", "Invalid blog post ID")
        return
    }

    var post models.BlogPost
    if err := db.DB.Where("id = ?", blogID).First(&post).Error; err != nil {
        utils.WriteError(w, http.StatusNotFound, "NOT_FOUND", "Blog post not found")
        return
    }

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(post)
}

// UpdateBlogPost godoc
// @Summary      Edit a blog post
// @Description  Allows a psychologist to edit their blog post
// @Tags         Actions for users
// @Accept       json
// @Produce      json
// @Param        blog_id path int true "Blog post ID"
// @Param        post body models.BlogPost true "Updated blog data"
// @Success      200 {object} map[string]interface{}
// @Failure      400,401,403,404,500 {object} map[string]interface{}
// @Router       /api/users/blog/post/{blog_id} [put]
// @Security     BearerAuth
func UpdateBlogPost(w http.ResponseWriter, r *http.Request) {
    email, ok := r.Context().Value("email").(string)
    if !ok || email == "" {
        utils.WriteError(w, http.StatusUnauthorized, "UNAUTHORIZED", "Unauthorized")
        return
    }

    blogID, err := strconv.ParseUint(chi.URLParam(r, "blog_id"), 10, 64)
    if err != nil {
        utils.WriteError(w, http.StatusBadRequest, "INVALID_ID", "Invalid blog post ID")
        return
    }

    var user models.User
    if err := db.DB.Where("email = ?", email).First(&user).Error; err != nil {
        utils.WriteError(w, http.StatusNotFound, "NOT_FOUND", "User not found")
        return
    }

    if user.Role != "psychologist" {
        utils.WriteError(w, http.StatusForbidden, "FORBIDDEN", "Only psychologists can edit blog posts")
        return
    }

    // Find blog post and verify ownership
    var post models.BlogPost
    if err := db.DB.Where("id = ? AND psychologist_id = ?", blogID, user.ID).First(&post).Error; err != nil {
        utils.WriteError(w, http.StatusNotFound, "NOT_FOUND", "Blog post not found or access denied")
        return
    }

    // Parse update data
    var updateData struct {
        Title   string `json:"title"`
        Content string `json:"content"`
    }
    if err := json.NewDecoder(r.Body).Decode(&updateData); err != nil {
        utils.WriteError(w, http.StatusBadRequest, "INVALID_FORMAT", "Invalid request format")
        return
    }

    // Update post
    post.Title = updateData.Title
    post.Content = updateData.Content

    if err := db.DB.Save(&post).Error; err != nil {
        utils.WriteError(w, http.StatusInternalServerError, "DB_ERROR", "Failed to update blog post")
        return
    }

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(map[string]interface{}{
        "success": true,
        "message": "Blog post updated successfully",
        "data":    post,
    })
}

// DeleteBlogPost godoc
// @Summary      Delete a blog post
// @Description  Allows a psychologist to delete their blog post
// @Tags         Actions for users
// @Produce      json
// @Param        blog_id path int true "Blog post ID"
// @Success      200 {object} map[string]interface{}
// @Failure      401,403,404,500 {object} map[string]interface{}
// @Router       /api/users/blog/post/{blog_id} [delete]
// @Security     BearerAuth
func DeleteBlogPost(w http.ResponseWriter, r *http.Request) {
    email, ok := r.Context().Value("email").(string)
    if !ok || email == "" {
        utils.WriteError(w, http.StatusUnauthorized, "UNAUTHORIZED", "Unauthorized")
        return
    }

    blogID, err := strconv.ParseUint(chi.URLParam(r, "blog_id"), 10, 64)
    if err != nil {
        utils.WriteError(w, http.StatusBadRequest, "INVALID_ID", "Invalid blog post ID")
        return
    }

    var user models.User
    if err := db.DB.Where("email = ?", email).First(&user).Error; err != nil {
        utils.WriteError(w, http.StatusNotFound, "NOT_FOUND", "User not found")
        return
    }

    if user.Role != "psychologist" {
        utils.WriteError(w, http.StatusForbidden, "FORBIDDEN", "Only psychologists can delete blog posts")
        return
    }

    // Find blog post and verify ownership
    var post models.BlogPost
    if err := db.DB.Where("id = ? AND psychologist_id = ?", blogID, user.ID).First(&post).Error; err != nil {
        utils.WriteError(w, http.StatusNotFound, "NOT_FOUND", "Blog post not found or access denied")
        return
    }

    if err := db.DB.Delete(&post).Error; err != nil {
        utils.WriteError(w, http.StatusInternalServerError, "DB_ERROR", "Failed to delete blog post")
        return
    }

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(map[string]interface{}{
        "success": true,
        "message": "Blog post deleted successfully",
    })
}