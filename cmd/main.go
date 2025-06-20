package main

import (
	"log"
	"net/http"
	"user-api/internal/db"
	"user-api/internal/handlers"
	authmw "user-api/internal/middleware"
	"user-api/internal/healthz"

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

	// Login Administrator
	r := chi.NewRouter()
	r.Use(middleware.Logger)
	r.Post("/api/admin/login", handlers.AdminLogin)
	// User login endpoint
	r.Post("/api/login", handlers.UserLogin)

	// Security admin URI
	r.Group(func(r chi.Router) {
		r.Use(authmw.RequireAdmin)

		r.Post("/api/admin/users", handlers.CreateUser)
		r.Delete("/api/admin/users/{id}", handlers.DeleteUser)
		r.Get("/api/admin/users/{id}", handlers.GetUser)
		r.Get("/api/admin/users", handlers.GetAllUsers)		
		r.Put("/api/admin/users/{id}", handlers.UpdateUser)

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
    	r.Delete("/api/admin/plans/{id}", handlers.DeletePlan)

    	r.Post("/api/admin/administrators", handlers.CreateAdmin)
    	r.Put("/api/admin/administrators/{id}", handlers.UpdateAdmin)
    	r.Delete("/api/admin/administrators/{id}", handlers.DeleteAdmin)
    	r.Get("/api/admin/administrators", handlers.GetAdministrators)


	})

	// Public registration and verification routes
	r.Post("/api/register", handlers.RegisterUser)
	r.Get("/api/verify", handlers.VerifyEmail)
	
	// Protected user endpoints
	r.Group(func(r chi.Router) {
		r.Use(authmw.RequireUser)

		r.Get("/api/users/{id}", handlers.ClientGetUser)
		r.Post("/api/reviews/{psychologist_id}", handlers.CreateReview)
		r.Put("/api/users/self/updateuser", handlers.ClientSelfUpdate)
		
		r.Post("/api/users/blog", handlers.CreateBlogPost)
		r.Get("/api/users/blog/{psychologist_id}", handlers.GetBlogPosts)

		r.Put("/api/users/self/skills", handlers.SetSpecialistSkills)



	})

	// Services API endpoints
	r.Get("/api/healthz", healthz.HealthCheck)
	r.Get("/swagger/*", httpSwagger.WrapHandler)

	log.Println("Server runned on: 8080")
	http.ListenAndServe(":8080", r)
}

