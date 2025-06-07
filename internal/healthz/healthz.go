package healthz

import (
	"encoding/json"
	"net/http"
	"user-api/internal/db"
	"github.com/rs/zerolog/log"
)

// HealthCheck godoc
// @Summary      Health check
// @Description  Returns the status of the server and database connection
// @Tags         health
// @Produce      json
// @Success      200 {object} map[string]string
// @Failure      503 {object} map[string]string
// @Router       /api/healthz [get]
func HealthCheck(w http.ResponseWriter, r *http.Request) {
	sqlDB, err := db.DB.DB()
	status := "ok"
	dbStatus := "up"

	if err != nil || sqlDB.Ping() != nil {
		status = "error"
		dbStatus = "down"
		log.Error().Msg("HealthCheck: database connection failed")
		w.WriteHeader(http.StatusServiceUnavailable)
	} else {
		w.WriteHeader(http.StatusOK)
	}

	response := map[string]string{
		"status":   status,
		"database": dbStatus,
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}