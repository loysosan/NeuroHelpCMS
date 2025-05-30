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

	r := chi.NewRouter()
	r.Use(middleware.Logger)

	r.Post("/admin/login", handlers.AdminLogin)

	// Public registration and verification routes
	r.Post("/register", handlers.RegisterUser)
	r.Get("/verify", handlers.VerifyEmail)

	r.Group(func(r chi.Router) {
		r.Use(authmw.RequireAdmin)

		r.Post("/admin/users", handlers.CreateUser)
		r.Get("/admin/{id}", handlers.GetUser)
		r.Get("/admin/users", handlers.GetAllUsers)
	})

	r.Get("/healthz", healthz.HealthCheck)

	r.Get("/swagger/*", httpSwagger.WrapHandler)

	log.Println("Server runned on: 8080")
	http.ListenAndServe(":8080", r)
}