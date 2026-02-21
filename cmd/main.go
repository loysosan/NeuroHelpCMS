package main

import (
	"log"
	"net/http"
	"user-api/internal/db"
	"user-api/internal/handlers"
	"user-api/internal/healthz"
	authmw "user-api/internal/middleware"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/joho/godotenv"

	_ "user-api/docs"

	httpSwagger "github.com/swaggo/http-swagger"
)

// @title           User API
// @version         1.0
// @description     Open API для взаємодії з користувачами
// @termsOfService  http://example.com/terms/

// @contact.name   Oleksandr Krasilia
// @contact.email  oleksandr@example.com

// @host      localhost:8080
// @BasePath  /

// @securityDefinitions.apikey BearerAuth
// @in header
// @name Authorization
// @description Enter JWT token as `Bearer <token>` (for example, `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)

// @security BearerAuth []

func main() {
	_ = godotenv.Load(".env")
	db.Connect()

	r := chi.NewRouter()
	r.Use(middleware.Logger)
	r.Post("/api/admin/login", handlers.AdminLogin)
	r.Post("/api/admin/refresh", handlers.AdminRefreshToken) // Добавляем роут для обновления админского токена
	r.Get("/api/admin/verify", handlers.VerifyAdminToken)

	// User login endpoint
	r.Post("/api/login", handlers.UserLogin)
	// Google OAuth endpoint
	r.Post("/api/auth/google", handlers.GoogleAuth)
	// Refresh token endpoint
	r.Post("/api/auth/refresh", handlers.RefreshToken)

	// Security admin URI
	r.Group(func(r chi.Router) {
		r.Use(authmw.RequireAdmin)

		r.Post("/api/admin/users", handlers.CreateUser)
		r.Delete("/api/admin/users/{id}", handlers.DeleteUser)
		r.Get("/api/admin/users/{id}", handlers.GetUser)
		r.Get("/api/admin/users", handlers.GetAllUsers)
		r.Put("/api/admin/users/{id}", handlers.UpdateUser)
		r.Put("/api/admin/users/{id}/password", handlers.AdminChangeUserPassword)
		r.Put("/api/admin/users/{id}/portfolio", handlers.AdminUpdateUserPortfolio)

		r.Post("/api/admin/skills", handlers.CreateSkill)
		r.Get("/api/admin/skills", handlers.GetSkills)
		r.Post("/api/admin/skills/categories", handlers.CreateSkillCategory)
		r.Get("/api/admin/skills/categories", handlers.GetSkillCategories)
		r.Delete("/api/admin/skills/{id}", handlers.DeleteSkill)
		r.Delete("/api/admin/skills/categories/{id}", handlers.DeleteSkillCategory)
		r.Put("/api/admin/skills/{id}", handlers.UpdateSkill)
		r.Put("/api/admin/skills/categories/{id}", handlers.UpdateSkillCategory)

		r.Get("/api/admin/plans", handlers.GetPlans)
		r.Post("/api/admin/plans", handlers.CreatePlan)
		r.Put("/api/admin/plans/{id}", handlers.UpdatePlan)
		r.Delete("/api/admin/plans/{id}", handlers.DeletePlan)

		r.Post("/api/admin/administrators", handlers.CreateAdmin)
		r.Put("/api/admin/administrators/{id}", handlers.UpdateAdmin)
		r.Delete("/api/admin/administrators/{id}", handlers.DeleteAdmin)
		r.Get("/api/admin/administrators", handlers.GetAdministrators)

		// Админські роути для новин
		r.Post("/api/admin/news", handlers.CreateNews)
		r.Get("/api/admin/news", handlers.GetAllNews)
		r.Get("/api/admin/news/{id}", handlers.GetNews)
		r.Put("/api/admin/news/{id}", handlers.UpdateNews)
		r.Delete("/api/admin/news/{id}", handlers.DeleteNews)

	})
	// Serve static files from the uploads directory
	r.Handle("/api/uploads/*", http.StripPrefix("/api/uploads/", http.FileServer(http.Dir("./uploads"))))

	// Public registration and verification routes
	r.Post("/api/register", handlers.RegisterUser)
	r.Get("/api/verify", handlers.VerifyEmail)

	// Публічні роути для новин (без авторизації)
	r.Get("/api/news", handlers.GetPublicNews)
	r.Get("/api/news/{id}", handlers.GetPublicNewsItem)
	r.Get("/api/news/count", handlers.GetNewsCount)
	r.Get("/api/news/home", handlers.GetHomeNews)

	// Public skills endpoint (needed for registration quiz)
	r.Get("/api/users/skills", handlers.GetAllSkillsByCategory)

	// Protected user endpoints
	r.Group(func(r chi.Router) {
		r.Use(authmw.RequireUser)

		r.Get("/api/users/{id}", handlers.GetUserProfile) // Змініть з GetUser на GetUserProfile
		r.Post("/api/reviews/{psychologist_id}", handlers.CreateReview)
		r.Put("/api/users/self/updateuser", handlers.ClientSelfUpdate)
		r.Put("/api/users/self/password", handlers.ChangePassword)

		r.Post("/api/users/blog", handlers.CreateBlogPost)

		r.Put("/api/users/blog/post/{blog_id}", handlers.UpdateBlogPost)
		r.Delete("/api/users/blog/post/{blog_id}", handlers.DeleteBlogPost)

		r.Put("/api/users/self/skills", handlers.SetSpecialistSkills)

		r.Get("/api/users/{user_id}/skills", handlers.GetUserSkills)

		r.Post("/api/users/portfolio/photo", handlers.UploadPortfolioPhoto)
		r.Delete("/api/users/portfolio/photo/{photo_id}", handlers.DeletePortfolioPhoto)

		r.Get("/api/users/self", handlers.GetSelfProfile)
		r.Put("/api/users/self/portfolio", handlers.UpdateSelfPortfolio)

		// Нові роути для керування мовами
		r.Post("/api/users/portfolio/language", handlers.AddLanguage)
		r.Put("/api/users/portfolio/language/{language_id}", handlers.UpdateLanguage)
		r.Delete("/api/users/portfolio/language/{language_id}", handlers.DeleteLanguage)
		r.Get("/api/users/{user_id}/portfolio/languages", handlers.GetLanguages)
		r.Get("/api/users/{user_id}/portfolio/educations", handlers.GetEducations)

		// Education CRUD
		r.Post("/api/users/portfolio/education", handlers.AddEducation)
		r.Put("/api/users/portfolio/education/{education_id}", handlers.UpdateEducation)
		r.Delete("/api/users/portfolio/education/{education_id}", handlers.DeleteEducation)

		// Child management (for clients)
		r.Get("/api/users/self/child", handlers.GetSelfChild)
		r.Put("/api/users/self/child", handlers.UpdateSelfChild)

		// Search endpoints (only for registered users)
		r.Post("/api/users/search/specialists", handlers.SearchSpecialists)
		r.Get("/api/users/search/specialists", handlers.SearchSpecialistsGET)

		// --- Routes for managing availability (for psychologists) ---
		r.Post("/api/users/availability", handlers.CreateAvailabilitySlot)
		r.Delete("/api/users/availability/{slotId}", handlers.DeleteAvailabilitySlot)

		// --- Schedule templates (for psychologists) ---
		r.Post("/api/users/schedule-templates", handlers.CreateScheduleTemplate)
		r.Get("/api/users/schedule-templates", handlers.GetMyScheduleTemplates)
		r.Put("/api/users/schedule-templates/{id}", handlers.UpdateScheduleTemplate)
		r.Delete("/api/users/schedule-templates/{id}", handlers.DeleteScheduleTemplate)
		r.Post("/api/users/schedule-templates/generate", handlers.GenerateSlotsFromTemplates)

		// --- Routes for sessions (for clients and psychologists) ---
		r.Post("/api/users/sessions/book/{slotId}", handlers.BookSession)
		r.Post("/api/users/sessions/request", handlers.RequestFreeTimeSession)
		r.Get("/api/users/sessions/my", handlers.GetMySessions)
		r.Put("/api/users/sessions/{id}/cancel", handlers.CancelSession)
		r.Put("/api/users/sessions/{id}/confirm", handlers.ConfirmSession)
		r.Put("/api/users/sessions/{id}/complete", handlers.CompleteSession)

		// --- Chat REST endpoints ---
		r.Post("/api/conversations", handlers.StartConversation)
		r.Get("/api/conversations", handlers.GetMyConversations)
		r.Get("/api/conversations/unread", handlers.GetUnreadCount)
		r.Get("/api/conversations/{id}/messages", handlers.GetConversationMessages)
	})

	// WebSocket chat — auth via ?token= query param (outside RequireUser middleware)
	r.Get("/api/ws/{id}", handlers.WSChat)

	// Public user endpoints
	r.Get("/api/users/blog/{psychologist_id}", handlers.GetBlogPosts)
	r.Get("/api/users/blog/post/{blog_id}", handlers.GetBlogPost)

	// Public route for viewing psychologist availability
	r.Get("/api/users/availability/{psychologistId}", handlers.GetPsychologistAvailability)
	// Public route for booking page (schedule info + slots)
	r.Get("/api/users/{id}/schedule-info", handlers.GetPsychologistScheduleInfo)

	// Services API endpoints
	r.Get("/api/healthz", healthz.HealthCheck)
	r.Get("/swagger/*", httpSwagger.WrapHandler)

	// Запуск сервера
	log.Println("Server running on port 8080")
	log.Fatal(http.ListenAndServe(":8080", r))
}
