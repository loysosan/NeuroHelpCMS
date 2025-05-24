package main

import (
	"log"
	"net/http"
	"user-api/internal/db"
	"user-api/internal/handlers"
	authmw "user-api/internal/middleware"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/joho/godotenv"
)

func main() {
	_ = godotenv.Load(".env")
	db.Connect()

	r := chi.NewRouter()
	r.Use(middleware.Logger)

	r.Post("/login", handlers.Login)

	r.Group(func(r chi.Router) {
		r.Use(authmw.RequireAdmin)

		r.Post("/users", handlers.CreateUser)
		r.Get("/users/{id}", handlers.GetUser)
		r.Get("/users", handlers.GetAllUsers)
	})

	log.Println("Server runned on: 8080")
	http.ListenAndServe(":8080", r)
}